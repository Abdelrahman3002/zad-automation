const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

function init() {
  try {
    transporter = nodemailer.createTransporter(config.email);
    transporter.verify((error) => {
      if (error) {
        console.warn('Email transporter not configured properly:', error.message);
      } else {
        console.log('Email server is ready to send notifications');
      }
    });
  } catch (error) {
    console.warn('Email transporter setup failed:', error.message);
  }
}

async function sendNewRequestNotification(request) {
  if (!transporter) {
    console.warn('Email transporter not available, skipping notification');
    return;
  }

  try {
    const mailOptions = {
      from: config.email.sender,
      to: config.email.adminEmail,
      subject: `🔔 جديد: طلب دعم - ${request.id}`,
      text: `Received new support request:\n\nRequest ID: ${request.id}\nService: ${request.service}\nCompany: ${request.company}\nPhone: ${request.phone}\nType: ${request.type || 'غير محدد'}\nStatus: new\nSubmitted: ${request.submittedAt}\n\nView in admin dashboard: ${config.frontendUrl}/admin.html`,
      html: `
        <h2>🔔 جديد: طلب دعم</h2>
        <p><strong>رقم الطلب:</strong> ${request.id}</p>
        <p><strong>الخدمة:</strong> ${request.service}</p>
        <p><strong>الشركة:</strong> ${request.company}</p>
        <p><strong>الهاتف:</strong> ${request.phone}</p>
        <p><strong>نوع العطل:</strong> ${request.type || 'غير محدد'}</p>
        <p><strong>الحالة:</strong> جديدة</p>
        <p><strong>تاريخ الاستلام:</strong> ${request.submittedAt}</p>
        <hr />
        <p>للوصول إلى لوحة التحكم، يرجى زيارة: <a href="${config.frontendUrl}/admin.html">${config.frontendUrl}/admin.html</a></p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`New request notification sent for request ${request.id}`);
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

async function sendResetEmail(user, resetToken) {
  if (!transporter) {
    console.warn('Email transporter not available, skipping reset email');
    return;
  }

  try {
    const mailOptions = {
      from: config.email.sender,
      to: user.email,
      subject: 'إعادة تعيين كلمة المرور - Zad Automation',
      text: `لقد تم طلب إعادة تعيين كلمة المرور لحسابك.\n\nالagraph sailed VALIDITY 24 hours:\n${config.frontendUrl}/reset-password.html?token=${resetToken}\n\nإذا لم تطلبعادة التعيين، تجشم هذه الرسالة.\n\nفريق دعم Zad Automation`,
      html: `
        <h2>إعادة تعيين كلمة المرور</h2>
        <p>تم طلب重新 تعيين كلمة المرور لحسابك.</p>
        <p><strong>الagraph sailed VALIDITY 24 hour.</strong></p>
        <p><a href="${config.frontendUrl}/reset-password.html?token=${resetToken}" style="background: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">إعادة تعيين كلمة المرور</a></p>
        <p>إذا لم تطلب重新 التعيين،你可以 تجشم هذه الرسالة.</p>
        <p>فريق دعم Zad Automation</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending reset email:', error);
  }
}

module.exports = { init, sendNewRequestNotification, sendResetEmail };