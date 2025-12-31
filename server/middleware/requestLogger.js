export function requestLogger(req, res, next) {
    /*console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.url} ` +
        `auth=${!!req.session?.user} ip=${req.ip}`
    );*/
    next();
}
