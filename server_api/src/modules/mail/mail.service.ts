import nodemailer, { Transporter } from "nodemailer";

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

    async sendVerificationCode(email: string, code: string): Promise<void> {

        const systemEmail = process.env.EMAIL;

        const mailOptions = {
            from: systemEmail,
            to: email,
            subject: "Your Verification Code",
            text: `Your verification code is: ${code}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding:20px;">
                    <h2>Welcome to IRPMS</h2>
                    <p>Your verification code is:</p>
                    <div style="
                        padding:15px;
                        font-size:24px;
                        font-weight:bold;
                        border:2px dashed #4CAF50;
                        text-align:center;
                        border-radius:6px;">
                        ${code}
                    </div>
                    <p>If you did not request this email, ignore it.</p>
                </div>
            `
        };

        await this.transporter.sendMail(mailOptions);
    }

}