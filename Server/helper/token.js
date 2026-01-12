import jwt from "jsonwebtoken";

export const generateToken=async(userId)=>{
   try{
     const token=jwt.sign({id:userId},process.env.JWT_SCERET,{
        expiresIn:"7d"
    })
    return token;
   }
   catch(error){
    throw new Error("Token generation failed");
   }
}