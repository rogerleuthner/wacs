/*
 * ****************************************************************************
 *  * Source code Copyright 2017 by Roger B. Leuthner
 *  *
 *  * This program is distributed in the hope that it will be useful, but 
 *  * WITHOUT ANY WARRANTY; without even the implied warranty of 
 *  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General
 *  * Public License for more details.
 *  *
 *  * Commercial Distribution License
 *  * If you would like to distribute this source code (or portions thereof) 
 *  * under a license other than the "GNU General Public License, version 2", 
 *  * contact Roger B. Leuthner through GitHub.
 *  *
 *  * GNU Public License, version 2
 *  * All distribution of this source code must conform to the terms of the GNU 
 *  * Public License, version 2.
 *  ***************************************************************************
 */

package com.cso.wac.data.services.misc;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.geom.Rectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import java.util.zip.ZipOutputStream;

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.apache.pdfbox.io.IOUtils;
import org.apache.pdfbox.io.MemoryUsageSetting;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.tools.imageio.ImageIOUtil;
import org.apache.poi.sl.usermodel.Slide;
import org.apache.poi.sl.usermodel.SlideShow;
import org.apache.poi.sl.usermodel.SlideShowFactory;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.fit.pdfdom.PDFDomTree;
import org.w3c.dom.Document;

import com.cso.wac.data.services.ConfigService;
import com.cso.wac.exc.FailedConvertException;

/**
 * Convert files into .zip files of images.
 *
 */

@Stateless
public class FileConvertService {

	// output file type.  'png' seems bigger
	private static final String IMAGE_FORMAT = "jpg";
	// DPI for .pdf conversion; this should make ordinary text just readable
	private static final int PDF_DPI = 120;

	@EJB
	private ConfigService configService;

	public FileConvertService() {

	}

	/**
	 * Convert PDF to Dom and return as string
	 *
	 * @param fileName
	 * @param chId
	 * @return String (Dom)
	 * @throws FailedConvertException
	 */
	public String convert2Dom( String fileName, Long chId ) throws FailedConvertException {
		Document dom;
		PDDocument pdf = null;
		try {
			pdf = PDDocument.load( assembleFile( fileName, chId ) );
			PDFDomTree parser = new PDFDomTree();
			dom = parser.createDOM( pdf );

		} catch ( Exception e ) {
			throw new FailedConvertException( e.getMessage() );
		} finally {
			if ( pdf != null ) {
				try {
					pdf.close();
				} catch (IOException e) {}
			}
		}

		String html;
		ByteArrayOutputStream bis = new ByteArrayOutputStream();
		try {
			TransformerFactory tF = TransformerFactory.newInstance();
			Transformer t = tF.newTransformer();
			DOMSource source = new DOMSource( dom );
			StreamResult result = new StreamResult( bis );
			t.transform( source, result );
			html = ((ByteArrayOutputStream)result.getOutputStream()).toString();

		} catch ( Exception e ) {
			throw new FailedConvertException( e.getMessage() );

		} finally {
			if ( bis != null ) {
				try {
					bis.close();
				} catch (IOException e) {}
			}
		}

		return html;
	}

	public int convert( String fileName, Long chId ) throws FailedConvertException {
		int pages = 0;

		// ugh
		// TODO fix file type determination
		String suffix = fileName.substring( fileName.lastIndexOf( '.' ) + 1, fileName.length() );
		try {
			switch( suffix.toLowerCase() ) {
				case "pdf":
					pages = convertPDF( assemblePath( fileName, chId ), chId );
					break;
				case "ppt":
					pages = convertPPT( assemblePath( fileName, chId ), chId );
					break;
				case "pptx":
					pages = convertPPTX( assemblePath( fileName, chId ), chId );
					break;

				default:
					throw new FailedConvertException( "Don't know how to convert file: " + suffix );
			}
		} catch ( NullPointerException | IOException e ) {
			throw new FailedConvertException( "Failed conversion: " + e.getMessage() );
		}

		return pages;
	}

	/**
	 * Construct and return conversion archive result name
	 *
	 * @param fileName
	 * @param chId
	 * @return
	 */
	public String assembleResultPath( String fileName, Long chId ) {
		return assemblePath( fileName, chId ) + ".zip";
	}

	public String assembleResultName( String fileName ) {
		return fileName + ".zip";
	}

	public String extractFileName( String zipName ) {
		return zipName.substring( 0, zipName.length() - 4 /* . z i p */);
	}

	private String assemblePath( String fileName, Long chId ) {
		return Paths.get( configService.get( ConfigService.KEY_FILESHARE_PATH ), chId.toString(), fileName ).toString();
	}

	private File assembleFile( String fileName, Long chId ) {
		return Paths.get( configService.get( ConfigService.KEY_FILESHARE_PATH ), chId.toString(), fileName ).toFile();
	}

	public byte[] getSlide( String origFile, Long chId, int slide ) throws Exception {
		ZipFile zf = null;
		ZipEntry ze = null;
		byte[] b;
		try {
			zf = new ZipFile( assembleResultPath( origFile, chId ) );
			ze = zf.getEntry( slide + "." + IMAGE_FORMAT);
			b = IOUtils.toByteArray( zf.getInputStream( ze ) );
		} finally {
			if ( zf != null ) {
				zf.close();
			}
		}
		return b;
	}

	private int convertPDF( String filename, Long chId ) throws IOException {
		FileOutputStream fos = new FileOutputStream( assembleResultPath( filename, chId ) );
		ZipOutputStream zos = new ZipOutputStream(fos);
		PDDocument document = PDDocument.load(new File(filename), MemoryUsageSetting.setupMainMemoryOnly());
		int pages = 0;
		try {
			// level - the compression level (0-9)
			zos.setLevel(9);
			PDFRenderer pdfRenderer = new PDFRenderer(document);

			for( ; pages < document.getNumberOfPages(); pages++ ) {
				BufferedImage bim = pdfRenderer.renderImageWithDPI( pages, PDF_DPI, ImageType.RGB );
				ZipEntry ze = new ZipEntry(pages + "." + IMAGE_FORMAT);
				zos.putNextEntry(ze);
				ImageIOUtil.writeImage(bim, IMAGE_FORMAT, zos, PDF_DPI);
				zos.flush();
			}

		} finally {
			if ( zos != null ) zos.close();
			if ( document != null ) document.close();
			if ( fos != null ) fos.close();
		}
		return pages;
	}

	private int convertPPT(String filename, Long chId) throws IOException {
		int pages = 0;
		FileOutputStream fos = new FileOutputStream(assembleResultPath(filename, chId));
		ZipOutputStream zos = new ZipOutputStream(fos);
		FileInputStream is = new FileInputStream(filename);
		SlideShow<?, ?> ppt = SlideShowFactory.create( is );
		is.close();

		try {

			double zoom = 2; // magnify it by 2
			AffineTransform at = new AffineTransform();
			at.setToScale(zoom, zoom);

			Dimension pgsize = ppt.getPageSize();

			List<?> slide = ppt.getSlides();
			for (int i = 0; i < slide.size(); i++) {
				BufferedImage img = new BufferedImage((int) Math.ceil(pgsize.width
						* zoom), (int) Math.ceil(pgsize.height * zoom),
						BufferedImage.TYPE_INT_RGB);
				Graphics2D graphics = img.createGraphics();
				graphics.setTransform(at);

				graphics.setPaint(Color.white);
				graphics.fill(new Rectangle2D.Float(0, 0, pgsize.width,
						pgsize.height));

				((Slide<?, ?>)slide.get( i )).draw( graphics );


				ZipEntry ze = new ZipEntry(pages + "." + IMAGE_FORMAT);
				zos.putNextEntry(ze);
				javax.imageio.ImageIO.write(img, IMAGE_FORMAT, zos);
				zos.flush();
				pages++;
			}
		} finally {
			if ( zos != null ) zos.close();
			if ( fos != null ) fos.close();
		}

		return pages;
	}

	private int convertPPTX(String filename, Long chId) throws IOException {
		int pages = 0;
		FileOutputStream fos = new FileOutputStream(assembleResultPath(filename, chId));
		ZipOutputStream zos = new ZipOutputStream(fos);
		FileInputStream is = new FileInputStream(filename);
		XMLSlideShow ppt = new XMLSlideShow(is);
		is.close();

		try {
			double zoom = 2; // magnify it by 2
			AffineTransform at = new AffineTransform();
			at.setToScale(zoom, zoom);

			Dimension pgsize = ppt.getPageSize();

			List<XSLFSlide> slide = ppt.getSlides();
			for (int i = 0; i < slide.size(); i++) {
				BufferedImage img = new BufferedImage((int) Math.ceil(pgsize.width
						* zoom), (int) Math.ceil(pgsize.height * zoom),
						BufferedImage.TYPE_INT_RGB);
				Graphics2D graphics = img.createGraphics();
				graphics.setTransform(at);

				graphics.setPaint(Color.white);
				graphics.fill(new Rectangle2D.Float(0, 0, pgsize.width,
						pgsize.height));

				graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING,
						RenderingHints.VALUE_ANTIALIAS_ON);
				graphics.setRenderingHint(RenderingHints.KEY_RENDERING,
						RenderingHints.VALUE_RENDER_QUALITY);
				graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION,
						RenderingHints.VALUE_INTERPOLATION_BICUBIC);
				graphics.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS,
						RenderingHints.VALUE_FRACTIONALMETRICS_ON);

				slide.get( i ).draw(graphics);
				ZipEntry ze = new ZipEntry(pages + "." + IMAGE_FORMAT);
				zos.putNextEntry(ze);
				javax.imageio.ImageIO.write(img, IMAGE_FORMAT, zos);
				zos.flush();
				pages++;
			}
		} finally {
			if ( zos != null ) zos.close();
			if ( fos != null ) fos.close();
			if ( ppt != null ) ppt.close();
		}

		return pages;
	}


//	public static void main(String[] args) throws IOException {
//		FileConvertService pc = new FileConvertService();
//		pc.convertPDF("C:\\Temp\\test.pdf");
//		System.out.println( " ... done pdf" );
//		pc.convertPPTX("C:\\Temp\\test.pptx");
//		System.out.println( "  ... done pptx" );
//		pc.convertPPT("C:\\Temp\\test.ppt");
//		System.out.println( "DONE" );
//	}
}
