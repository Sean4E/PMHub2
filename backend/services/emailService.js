const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  async sendTaskAssignmentEmail(user, task, project) {
    try {
      const mailOptions = {
        from: `PM Hub <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: `New Task Assigned: ${task.title}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .task-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .priority-badge { display: inline-block; padding: 5px 10px; border-radius: 3px; font-size: 12px; font-weight: bold; }
                .priority-high { background: #fee; color: #c33; }
                .priority-medium { background: #ffeaa7; color: #d63031; }
                .priority-low { background: #dfe6e9; color: #2d3436; }
                .priority-critical { background: #ff7675; color: white; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎯 New Task Assigned</h1>
                </div>
                <div class="content">
                  <p>Hi ${user.name},</p>
                  <p>You have been assigned a new task in the project <strong>${project.name}</strong>.</p>

                  <div class="task-details">
                    <h2>${task.title}</h2>
                    <p>${task.description || 'No description provided'}</p>
                    <p><strong>Priority:</strong> <span class="priority-badge priority-${task.priority}">${task.priority.toUpperCase()}</span></p>
                    <p><strong>Due Date:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}</p>
                    <p><strong>Estimated Hours:</strong> ${task.estimatedHours || 'Not set'}</p>
                  </div>

                  <a href="${process.env.FRONTEND_URL}/projects/${project.id}" class="button">View Task</a>

                  <p style="margin-top: 30px; color: #666; font-size: 14px;">
                    This is an automated email from PM Hub. Please do not reply to this email.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending task assignment email:', error);
      return false;
    }
  }

  async sendTaskDeadlineReminder(user, task, project) {
    try {
      const mailOptions = {
        from: `PM Hub <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: `⏰ Task Deadline Approaching: ${task.title}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .task-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f5576c; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⏰ Deadline Reminder</h1>
                </div>
                <div class="content">
                  <p>Hi ${user.name},</p>
                  <p>This is a reminder that your task deadline is approaching!</p>

                  <div class="task-details">
                    <h2>${task.title}</h2>
                    <p><strong>Project:</strong> ${project.name}</p>
                    <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> ${task.status}</p>
                  </div>

                  <a href="${process.env.FRONTEND_URL}/projects/${project.id}" class="button">View Task</a>
                </div>
              </div>
            </body>
          </html>
        `
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending deadline reminder email:', error);
      return false;
    }
  }

  async sendProjectInvitation(user, project, invitedBy) {
    try {
      const mailOptions = {
        from: `PM Hub <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: `Project Invitation: ${project.name}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Project Invitation</h1>
                </div>
                <div class="content">
                  <p>Hi ${user.name},</p>
                  <p>${invitedBy.name} has invited you to join the project <strong>${project.name}</strong>.</p>
                  <p>${project.description || ''}</p>

                  <a href="${process.env.FRONTEND_URL}/projects/${project.id}" class="button">View Project</a>
                </div>
              </div>
            </body>
          </html>
        `
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending project invitation email:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
