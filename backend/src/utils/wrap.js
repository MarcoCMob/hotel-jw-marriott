// Express 4 no captura errores de funciones async; este wrapper los envía al manejador de errores.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
