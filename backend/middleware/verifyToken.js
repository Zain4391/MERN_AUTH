import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.cookies.token; //we called the cokkie as token, hence we use token
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "You are not authorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    //add a userId field to the request
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
