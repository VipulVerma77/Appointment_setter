import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true,
}))

app.use(express.json({limit:'16kb'}))
app.use(express.urlencoded({extended: true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


import authRouter from "./routes/auth.route.js"
import doctorRouter from "./routes/doctor.route.js"
import appointMentRouter from "./routes/appointment.route.js"
import categoryRouter from "./routes/category.route.js"
import paymentRoute from "./routes/payment.route.js"

app.use("/api/v1/users", authRouter)
app.use("/api/v1/appointment", appointMentRouter)
app.use("/api/v1/category", categoryRouter)
app.use("/api/v1/doctor", doctorRouter)
app.use("/api/v1/payment", paymentRoute)



export {app}