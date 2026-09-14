import nodemailer from 'nodemailer';

const getEmailConfig = () => {
    const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || '';
    const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10);
    const user = process.env.EMAIL_USER || process.env.SMTP_USER || '';
    const pass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASS || '';
    const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || `"GreenBond Security" <${user || 'no-reply@greenbond.com'}>`;

    const isConfigured = Boolean(host && user && pass);
    return { host, port, user, pass, from, isConfigured };
};

export const sendPasswordResetEmail = async (email, otp) => {
    const config = getEmailConfig();
    const isProd = process.env.NODE_ENV === 'production';

    if (config.isConfigured) {
        try {
            const transporter = nodemailer.createTransport({
                host: config.host,
                port: config.port,
                secure: config.port === 465,
                auth: {
                    user: config.user,
                    pass: config.pass
                }
            });

            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #15803d; font-size: 24px; font-weight: 800; margin: 0;">GreenBond</h1>
                        <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">Account Security & Recovery</p>
                    </div>
                    <div style="padding: 20px; background: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0; text-align: center;">
                        <p style="color: #166534; font-size: 14px; margin: 0 0 12px 0;">Your password reset verification code is:</p>
                        <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #15803d; font-family: monospace;">${otp}</div>
                        <p style="color: #15803d; font-size: 12px; margin: 12px 0 0 0;">Valid for <strong>10 minutes</strong>. Single-use only.</p>
                    </div>
                    <p style="color: #4b5563; font-size: 12px; line-height: 1.5; margin-top: 20px;">
                        If you did not request a password reset, please ignore this email or contact support if you suspect unauthorized access.
                    </p>
                    <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 20px 0;" />
                    <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">
                        &copy; ${new Date().getFullYear()} GreenBond Marketplace. All rights reserved.
                    </p>
                </div>
            `;

            await transporter.sendMail({
                from: config.from,
                to: email,
                subject: 'GreenBond — Password Reset Verification Code',
                text: `Your GreenBond password reset verification code is: ${otp}. It is valid for 10 minutes.`,
                html: htmlContent
            });

            return { success: true, mode: 'smtp' };
        } catch (error) {
            console.error('[AUTH EMAIL SERVICE] SMTP delivery error:', error.message);
            if (!isProd) {
                console.log(`[AUTH EMAIL SERVICE - DEV ONLY] OTP for ${email}: ${otp}`);
            }
            return { success: false, mode: 'fallback', error: error.message };
        }
    } else {
        if (!isProd) {
            console.log(`[AUTH EMAIL SERVICE - DEV ONLY] SMTP not configured. Generated OTP for ${email}: ${otp}`);
        } else {
            console.warn('[AUTH EMAIL SERVICE] Warning: EMAIL_HOST, EMAIL_USER, or EMAIL_PASSWORD not configured in production.');
        }
        return { success: true, mode: 'dev' };
    }
};
