import nodemailer, { Transporter } from "nodemailer";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";

export type VerificationCodePurpose =
    | "activation"
    | "password-reset";


export class MailService {

    private transporter: Transporter;

    constructor() {

        const systemEmail = process.env.EMAIL;
        const password = process.env.EMAIL_PASSWORD;

        if (!systemEmail || !password) {
            throw new Error("Email credentials not configured.");
        }

        this.transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: systemEmail,
                pass: password
            }
        });
    }

    async sendCode(
        email: string,
        code: string,
        expiresAt: Date,
        purpose: VerificationCodePurpose
    ): Promise<void> {
        const systemEmail = process.env.EMAIL;
        const isActivation = purpose === "activation";

        const title = isActivation
            ? "Activate Your IRPMS Account"
            : "Reset Your IRPMS Password";

        const message = isActivation
            ? "Use the verification code below to activate your IRPMS account."
            : "Use the verification code below to reset your IRPMS password.";

        const subject = isActivation
            ? "Your IRPMS Account Activation Code"
            : "Your IRPMS Password Reset Code";

        const formattedExpiry = expiresAt.toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Africa/Addis_Ababa"
        });

        const mailOptions = {
            from: systemEmail,
            to: email,
            subject,
            text: `${title} ${message} Your verification code is: ${code}
            This code expires on ${formattedExpiry}.
            For your security, please do not share this code with anyone. 
            If you did not request this code, you can safely ignore this email.
            Wolkite University · IRPMS`.trim(),

            html: `
            <div style="
                font-family: Arial, Helvetica, sans-serif;
                background-color: #f5f7fa;
                padding: 40px 20px;
                color: #333;
            ">
                <div style="
                    max-width: 520px;
                    margin: 0 auto;
                    background: #ffffff;
                    border-radius: 10px;
                    padding: 32px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                ">

                    <h2 style="
                        margin: 0 0 12px;
                        color: #2c3e50;
                    ">
                        ${title}
                    </h2>

                    <p style="
                        font-size: 15px;
                        line-height: 1.6;
                    ">
                        ${message}
                    </p>

                    <div style="
                        margin: 25px 0;
                        padding: 18px;
                        font-size: 28px;
                        font-weight: bold;
                        letter-spacing: 6px;
                        text-align: center;
                        border: 2px dashed #4CAF50;
                        border-radius: 8px;
                        background-color: #f8fff8;
                        color: #2e7d32;
                    ">
                        ${code}
                    </div>

                    <p style="
                        font-size: 14px;
                        color: #666;
                        line-height: 1.5;
                    ">
                        ⏱ This code expires on
                        <strong>${formattedExpiry}</strong>.
                    </p>

                    <p style="
                        font-size: 14px;
                        color: #666;
                        line-height: 1.5;
                    ">
                        For your security, please do not share this code
                        with anyone.
                    </p>

                    <hr style="
                        border: none;
                        border-top: 1px solid #eee;
                        margin: 25px 0;
                    ">

                    <p style="
                        font-size: 12px;
                        color: #999;
                        line-height: 1.5;
                    ">
                        If you did not request this code, you can safely
                        ignore this email.
                    </p>

                    <p style="
                        font-size: 12px;
                        color: #999;
                        margin-top: 20px;
                    ">
                        Wolkite University · IRPMS
                    </p>

                </div>
            </div>        `        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error: any) {
            throw new AppError(
                ERROR_CODES.EMAIL_SEND_FAILED,
                "Unable to send the email. Please try again later."
            );
        }
    }

}