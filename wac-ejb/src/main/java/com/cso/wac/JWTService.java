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

package com.cso.wac;

import java.net.InetAddress;
import java.util.Date;

import javax.annotation.PostConstruct;
import javax.ejb.EJB;
import javax.ejb.Stateless;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.cso.wac.data.services.ConfigService;
import com.cso.wac.exc.JWSException;
import com.cso.wac.exc.ProgrammingException;

/**
 * Create, validate, extract data wrt JWT Tokens protected with JWS
 *
 * Using a MAC ("alg":"HS256") because MACs are specifically designed to prevent
 * alteration of the payload, while encryption algorithms (counter-intuitively) are not.
 * here we don't care about encryption, as SSL is the baseline encrypter, but we need to make
 * sure the claims were not tampered with on the client.
 *
 * ConfigService generates the shared secret for each application startup since it
 * is a singleton service suitable for holding data that must be consistent across the WAC.
 * TODO should that generation be moved into here so all JWT logic is consolidated?
 * For performance reasons, JWTService is NOT singleton while the shared secret needs
 * to be (it needs to be consistent across the application), as the JWTService must be used
 * to verify JWT's constantly and frequently.
 *
 * @author rleuthner
 *
 */

@Stateless //( mappedName = "JWT")  // add mapped name to allow other .wars to refer
public class JWTService {

	public static String JWT_COOKIE = "WAC_jwt";  // this is also defined in the front end code AND the wac-ext-owf java code
													// TODO cookie names need to be available in config service ... but that still
													// would not help the wac-ext-owf definition ... unless it issues a rest call
													// to get the configs

	@EJB
	private ConfigService configService;

	private static String WAC_DATA = "WAC_DATA"; // key to custom claim containing set of app data
	private JWSVerifier verifier;
	private static JWSSigner signer;

	public JWTService() {}

	@PostConstruct
	private void init() {
		signer = new MACSigner( configService.getSharedSecret() );
		verifier = new MACVerifier( configService.getSharedSecret() );
	}

	/**
	 * Main user entry point for creating the session JWS.  Access to this must be prevented
	 * by unauthenticated users, otherwise anyone could build any JWT they want with any
	 * privs they want.
	 *
	 * @param {String} userId
	 * @param {String[]} role strings corresponding to annotated jaxrs RolesAllowed(...)
	 * @param {String} channel
	 * @return
	 * @throws JOSEException
	 */
	public String buildJwsJwt( String userId, String[] roles, Long chId ) throws JWSException {
		try {
			// Prepare JWT with claims set
			JWTClaimsSet claimsSet = new JWTClaimsSet();
			claimsSet.setIssueTime(new Date());
			claimsSet.setIssuer( InetAddress.getLocalHost().getHostName() );
			claimsSet.setCustomClaim( WAC_DATA, new JWTData( userId, roles, chId ) );
			claimsSet.setSubject( userId );

			SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claimsSet);

			// Apply the HMAC
			signedJWT.sign(signer);

			return signedJWT.serialize();
		} catch ( Exception e ) {
			// TODO may not want to pass all of the info back
			throw new JWSException( e.getMessage() );
		}
	}

	/**
	 * Main entry point for first verifying and then extracting info from the JWS.  This
	 * needs to execute quickly as it is performed for each request.
	 *
	 * We could verify the username, but the JWS is signed so that any changes cause failure of verification,
	 * so expect that that user is the same (along with all other data).
	 *
	 * @param jws
	 * @return  roles String[]
	 * @throws JOSEException
	 */
	public JWTData verifyJwGetData( String jws ) throws JWSException {

		String err;
		try {
			if ( jws != null && !jws.isEmpty() ) {
				SignedJWT signedJWT = SignedJWT.parse( jws );
				if ( signedJWT.verify( verifier ) ) {
					try {
						return JWTData.JWTWACDataFactory( signedJWT.getJWTClaimsSet().getCustomClaim( WAC_DATA ).toString() );

					} catch (Exception e) {
						err = e.getMessage();
					}
				} else {
					err = "JWT failed verification, has been altered";
				}
			} else {
				err = "JWT not provided";
			}
		} catch ( Exception pe ) {
			err = "JWT failed parse: " + pe.getMessage();
		}
		throw new JWSException( err );
	}

	// assuming already verified, just extract custom claims into struct and return for use
	public JWTData getData( String jws ) {
		// assert jws already validated, verified so no error checking here
		try {
			return JWTData.JWTWACDataFactory( SignedJWT.parse( jws ).getJWTClaimsSet().getCustomClaim( WAC_DATA ).toString() );
		} catch (Exception e) {
			throw new ProgrammingException( "JWT data extraction failed, check your code.  The JWT should be pre-validated before coming here." );
		}
	}
}
