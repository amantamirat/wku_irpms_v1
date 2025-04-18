const bcrypt = require("bcryptjs");

const prepareHash = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

const sendEmail = async (email, code) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.USER,
                pass: process.env.PASS,
            }
        });
        const myOptions = {
            from: process.env.USER,
            to: email,
            subject: "Email Verification",
            text: "Hello Welcome, Here is Verfication Code to Activate Your Account ",
            html: " <h2>" + code + "</h2>"
        }
        transporter.sendMail(myOptions, function (error, info) {
            if (error) {
                //if email is not found delete the user
                console.log(error);
                //throw error;
            } else {
                console.log("Email Sent:" + info.response);
            }
        });

    } catch (error) {
        console.log(error);
        return error;
    }
};
module.exports = {prepareHash};