Dev Issues
----------
Don't use EJB for the api classes; if you do, EJB security will be applied instead of the desired jax-rs which will break it.

JAX-RS CDI managed beans (all wapi rest services) are managed in request scope.

If a JAX-RS Provider or javax.ws.rs.Application subclass does not define a scope explicitly, it is bound to the Application scope.
Therefor JAX-RS filters annotated with @Provider are @ApplicationScoped. 