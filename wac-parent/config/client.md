Browsers are limited in the number of concurrent persistent connections (somewhere from 4 to 8, depending upon browser).

This limit is fixed upon a domain-name basis, as such can be worked around by providing redundant hosts file entries (which
the apps would need to be pointed to).
e.g. add:
127.0.0.1 one.wac
127.0.0.1 two.wac
127.0.0.1 three.wac
127.0.0.1 four.wac

to the 'hosts' file, then group apps into the urls (e.g. https://two.wac:9443/wac-wx/someapp1, https://three.wac:9443/wac-wx/someapp2)

another method for the same thing is to create multiple DNS entries going to the same ip address;


alternatively, firefox may be reconfigured e.g.:
about:config
	network.http.max-connections;256
	network.http.max-persistent-connections-per-proxy;256
	network.http.max-persistent-connections-per-server;256

BUT here appears to be no way to similarly configure chrome