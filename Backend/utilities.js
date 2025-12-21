import jwt from "jsonwebtoken"

function authenticateToken(req,res,next){
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if(!token) return res.status(401).json({message:"No token provided"});

    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, (err,user) => {
        if(err) {
            return res.status(403).json({message:"Invalid or expired token"});
        }
        req.user = user;
        return next();
    });

}

export default authenticateToken;