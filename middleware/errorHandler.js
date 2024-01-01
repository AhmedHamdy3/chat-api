export const notFound = (req, res, next) => {
	const error = new Error("Error 404! Not Found " + req.originalUrl)
	res.status(404)
	next(error)
}

export const errorHandler = (err, req, res, next) => {
	console.log(err)
	const msg = res.statusCode === 200 ? "Server internal error" : err.message
	const code = res.statusCode === 200 ? 500 : res.statusCode
	res.status(code).json({
		message: err.message,
		stack: err.stack,
	})
}
