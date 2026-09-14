/**
 * Maileroo Email Service
 * Dispatches transactional emails via Supabase Edge Function ('send-email') to Maileroo REST API.
 */

import QRCode from 'qrcode';
import { Attendee, EventItem, StaffMember } from '@/types';
import { uploadQRCodeToCloudinary } from './cloudinary';
import { supabase } from './supabase';

const FROM_EMAIL = 'noreply@2a1936634eca676b.maileroo.org';
const FROM_NAME = 'EventFlow';

export interface SendEmailPayload {
  type?: 'registration_confirmation' | 'staff_invite' | 'generic';
  fromAddress: string;
  fromName: string;
  toAddress: string;
  toName?: string;
  subject: string;
  html: string;
  plain?: string;
}

/**
 * Core send helper via Supabase Edge Function ('send-email')
 * Dispatches transactional emails securely server-side to prevent browser CORS failures
 * and keep the Maileroo API key off the client.
 */
async function sendEmail(payload: SendEmailPayload): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: payload.type || 'generic',
        fromAddress: payload.fromAddress,
        fromName: payload.fromName,
        toAddress: payload.toAddress,
        toName: payload.toName,
        subject: payload.subject,
        html: payload.html,
        plain: payload.plain || '',
      },
    });

    if (error) {
      let detailedMsg = error.message || 'Edge function invocation failed.';
      try {
        if ('context' in error && error.context) {
          const bodyJson = await (error as any).context.json();
          if (bodyJson?.error) {
            detailedMsg = bodyJson.error;
          } else if (bodyJson?.message) {
            detailedMsg = bodyJson.message;
          }
        }
      } catch {
        // Fall back to error.message if context json parsing fails
      }
      console.error('[Email] Supabase Edge Function error:', detailedMsg);
      return { success: false, message: detailedMsg };
    }

    if (!data || data.success === false) {
      const failMsg = data?.error || data?.message || 'Email delivery failed through Maileroo.';
      console.error('[Email] Maileroo delivery failure:', failMsg);
      return { success: false, message: failMsg };
    }

    return { success: true, message: data.message || 'Email sent successfully.' };
  } catch (err: any) {
    console.error('[Email] Unexpected error during sendEmail:', err);
    return { success: false, message: err?.message || 'Failed to send email. Please try again.' };
  }
}

/**
 * Generate QR code as base64 PNG data-URI
 */
async function generateQRDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: { dark: '#1A1A1A', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    });
  } catch {
    return '';
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 1. Registration Confirmation Email (High Inbox Deliverability)
// ─────────────────────────────────────────────────────────────────────
export async function sendRegistrationConfirmation(
  attendee: Attendee,
  event: EventItem
): Promise<{ success: boolean; message: string }> {
  if (!attendee.email || attendee.email === 'attendee@example.com') {
    return { success: false, message: 'No valid email address for attendee.' };
  }

  const qrValue = attendee.qrToken || attendee.registrationId;
  const qrBase64 = await generateQRDataUrl(qrValue);
  
  // Upload to Cloudinary to provide a permanent, trusted HTTPS image URL
  let qrHttpsUrl = '';
  if (qrBase64) {
    qrHttpsUrl = await uploadQRCodeToCloudinary(qrBase64, `pass_${attendee.registrationId}`);
  }
  if (!qrHttpsUrl) {
    qrHttpsUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrValue)}&size=300&ecLevel=H&margin=2`;
  }

  const eventDate = formatDate(event.date || '');
  const brandColor = event.branding?.primaryColor || '#1A1A1A';
  const passUrl = typeof window !== 'undefined' ? `${window.location.origin}/e/${event.slug}/pass/${attendee.id}` : '#';

  // Optimized HTML compliant with strict email client anti-spam guidelines
  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Event Pass Confirmation</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#F5F3EE;color:#1A1A1A;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F5F3EE;padding:30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:580px;background:#ffffff;border:1px solid #E8E5DF;border-radius:20px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.03);">
          
          <!-- Event Header Banner -->
          <tr>
            <td style="background-color:${brandColor};padding:32px 35px;text-align:center;color:#ffffff;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <span style="display:inline-block;padding:4px 12px;border-radius:16px;background:rgba(255,255,255,0.2);color:#F5EDD8;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
                      Official Event Pass
                    </span>
                    <h1 style="margin:12px 0 6px;color:#ffffff;font-size:24px;font-weight:800;line-height:1.3;letter-spacing:-0.3px;">
                      ${event.name}
                    </h1>
                    <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;font-weight:500;">
                      ${eventDate} &bull; ${event.city || event.venueName || 'Venue'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delegate Greeting -->
          <tr>
            <td style="padding:28px 35px 12px;">
              <p style="margin:0;font-size:15px;color:#1A1A1A;line-height:1.5;">Hello <strong>${attendee.fullName}</strong>,</p>
              <p style="margin:8px 0 0;font-size:14px;color:#555555;line-height:1.6;">
                Your registration for <strong>${event.name}</strong> has been successfully confirmed. Below is your official entry pass and QR ticket.
              </p>
            </td>
          </tr>

          <!-- Ticket Box -->
          <tr>
            <td style="padding:8px 35px 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#FAFAF7;border:1px solid #E8E5DF;border-radius:16px;">
                <tr>
                  <td style="padding:22px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <!-- Left Details -->
                        <td width="55%" valign="top" style="padding-right:15px;">
                          <p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#888888;">Registration ID</p>
                          <p style="margin:0 0 14px;font-size:16px;font-weight:800;color:#C49A3C;font-family:monospace;">
                            ${attendee.registrationId}
                          </p>

                          <p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#888888;">Delegate Name</p>
                          <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#1A1A1A;">
                            ${attendee.fullName}
                          </p>

                          <p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#888888;">Access Tier</p>
                          <p style="margin:0 0 14px;font-size:13px;font-weight:600;color:#333333;">
                            ${attendee.ticketType || 'General Attendee'}
                          </p>

                          <p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#888888;">Venue Location</p>
                          <p style="margin:0;font-size:13px;font-weight:600;color:#1A1A1A;">
                            ${event.venueName || 'Main Venue'}
                          </p>
                          ${event.venueAddress ? `<p style="margin:2px 0 0;font-size:11px;color:#666666;">${event.venueAddress}</p>` : ''}
                        </td>

                        <!-- Right QR Code (Cloudinary HTTPS) -->
                        <td width="45%" align="center" valign="middle" style="border-left:1px dashed #E0DCD5;padding-left:10px;">
                          <div style="background:#ffffff;padding:8px;border-radius:12px;border:1px solid #E8E5DF;display:inline-block;">
                            <img
                              src="${qrHttpsUrl}"
                              alt="Entry QR Pass"
                              width="150"
                              height="150"
                              border="0"
                              style="display:block;border:0;outline:none;border-radius:6px;"
                            />
                          </div>
                          <p style="margin:8px 0 0;font-size:11px;font-weight:600;color:#666666;">
                            Universal Check-in QR
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Schedule bar -->
                <tr>
                  <td style="background:#F5EDD8;border-top:1px solid #EEDDC0;padding:10px 22px;border-radius:0 0 15px 15px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-size:11px;color:#8B6914;font-weight:600;">
                          Time: ${event.startTime || '09:00 AM'} - ${event.endTime || '05:00 PM'}
                        </td>
                        <td align="right" style="font-size:11px;color:#8B6914;font-weight:600;">
                          ${event.city || 'Event Venue'}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- View Online Pass Button -->
          <tr>
            <td align="center" style="padding:5px 35px 25px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#1A1A1A;border-radius:12px;">
                    <a
                      href="${passUrl}"
                      target="_blank"
                      style="display:inline-block;padding:13px 28px;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.2px;"
                    >
                      View Live Digital Pass &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Clean Footer -->
          <tr>
            <td style="background:#FAFAF7;border-top:1px solid #E8E5DF;padding:18px 35px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#888888;">
                Organized by ${event.organizerName || 'Event Host'} &bull; Powered by EventFlow
              </p>
              <p style="margin:4px 0 0;font-size:10px;color:#AAAAAA;">
                For queries, contact the event management team.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Matched anti-spam compliant transactional plain text
  const plain = `Your Official Ticket & Entry Pass\n\nHello ${attendee.fullName},\n\nYour registration for "${event.name}" is confirmed!\n\nTicket & Entry Details:\n-----------------------------------------\nRegistration ID: ${attendee.registrationId}\nDelegate Name: ${attendee.fullName}\nTicket Type: ${attendee.ticketType || 'General Attendee'}\nDate: ${eventDate}\nTime: ${event.startTime || '09:00 AM'} - ${event.endTime || '05:00 PM'}\nVenue: ${event.venueName || 'Venue'} (${event.venueAddress || event.city || ''})\n\nView and Download Your Live QR Pass:\n${passUrl}\n\nOrganized by: ${event.organizerName || 'Event Host'}\nContact: ${event.organizerEmail || ''} ${event.organizerContact || ''}\n\nPlease present your QR pass at the entrance check-in desk for fast admission.`;

  return sendEmail({
    type: 'registration_confirmation',
    fromAddress: FROM_EMAIL,
    fromName: event.name ? `${event.name}` : FROM_NAME,
    toAddress: attendee.email,
    toName: attendee.fullName,
    subject: `Entry Ticket & Pass: ${event.name} (${attendee.registrationId})`,
    html,
    plain,
  });
}

// ─────────────────────────────────────────────────────────────────────
// 2. Staff Operator Invitation Email (High Inbox Deliverability)
// ─────────────────────────────────────────────────────────────────────
export async function sendStaffInvite(
  staff: StaffMember,
  event: EventItem,
  rawPassword?: string
): Promise<{ success: boolean; message: string }> {
  if (!staff.email) {
    return { success: false, message: 'No email address for staff member.' };
  }

  const staffToken = staff.loginToken || staff.accessCode || (staff.id ? `OP-${staff.id.slice(-6).toUpperCase()}` : 'STAFF');
  const tempPass = rawPassword || staff.loginToken || staffToken;
  const qrBase64 = await generateQRDataUrl(staffToken);
  
  let qrHttpsUrl = '';
  if (qrBase64) {
    qrHttpsUrl = await uploadQRCodeToCloudinary(qrBase64, `staff_${staffToken}`);
  }
  if (!qrHttpsUrl) {
    qrHttpsUrl = `https://quickchart.io/qr?text=${encodeURIComponent(staffToken)}&size=300&ecLevel=H&margin=2`;
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const loginUrl = `${baseUrl}/login?role=staff&email=${encodeURIComponent(staff.email)}&token=${encodeURIComponent(tempPass)}`;
  const roleText = staff.role === 'admin' ? 'Administrator (Full Console Access)' : 'Check-In Staff (Scanner Desk Access)';
  const eventName = event?.name || 'All Events (Universal Access)';

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Staff Portal Access & Login Credentials</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#F5F3EE;color:#1A1A1A;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F5F3EE;padding:30px 15px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:580px;background:#ffffff;border:1px solid #E8E5DF;border-radius:20px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.03);">
          
          <!-- Banner Header -->
          <tr>
            <td style="background-color:#1A1A1A;padding:32px 35px;text-align:center;color:#ffffff;">
              <span style="display:inline-block;padding:4px 12px;border-radius:16px;background:rgba(196,154,60,0.25);color:#F5EDD8;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
                Staff Portal Invitation
              </span>
              <h1 style="margin:12px 0 6px;color:#ffffff;font-size:22px;font-weight:800;line-height:1.3;">
                Welcome, ${staff.name}
              </h1>
              <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;">
                Assigned Event: <strong>${eventName}</strong>
              </p>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:28px 35px 12px;">
              <p style="margin:0;font-size:14px;color:#1A1A1A;line-height:1.5;">
                You have been invited as an authorized team member for <strong>${eventName}</strong>.
              </p>
              <p style="margin:8px 0 0;font-size:13px;color:#555555;line-height:1.6;">
                Below are your official sign-in credentials and temporary password. Use them to log in to the portal.
              </p>
            </td>
          </tr>

          <!-- Credentials Card -->
          <tr>
            <td style="padding:8px 35px 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#FAFAF7;border:1px solid #E8E5DF;border-radius:16px;padding:22px;">
                <tr>
                  <td width="60%" valign="top" style="padding-right:15px;">
                    <p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#888888;">Login Username (Email)</p>
                    <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#1A1A1A;word-break:break-all;">
                      ${staff.email}
                    </p>

                    <p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#888888;">Temporary Password</p>
                    <div style="margin:0 0 14px;padding:8px 12px;background:#ffffff;border:1px dashed #C49A3C;border-radius:8px;display:inline-block;">
                      <span style="font-size:15px;font-weight:800;color:#C49A3C;font-family:monospace;letter-spacing:1px;">
                        ${tempPass}
                      </span>
                    </div>

                    <p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#888888;">Access Role</p>
                    <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#8B6914;">
                      ${roleText}
                    </p>

                    <p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#888888;">Assigned Scope</p>
                    <p style="margin:0;font-size:12px;font-weight:600;color:#333333;">
                      ${eventName}
                    </p>
                  </td>
                  <td width="40%" align="center" valign="middle" style="border-left:1px dashed #E0DCD5;padding-left:10px;">
                    <img
                      src="${qrHttpsUrl}"
                      alt="Staff QR"
                      width="130"
                      height="130"
                      border="0"
                      style="display:block;margin:0 auto;border-radius:6px;"
                    />
                    <p style="margin:6px 0 0;font-size:10px;color:#888888;font-weight:600;">Scan QR Login</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Login CTA Button -->
          <tr>
            <td align="center" style="padding:5px 35px 25px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#1A1A1A;border-radius:12px;">
                    <a
                      href="${loginUrl}"
                      target="_blank"
                      style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.3px;"
                    >
                      Log In to Event Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font-size:11px;color:#888888;">
                Direct Login Link: <a href="${loginUrl}" style="color:#C49A3C;text-decoration:underline;">${loginUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#FAFAF7;border-top:1px solid #E8E5DF;padding:15px 35px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#888888;">EventFlow Event Management System</p>
              <p style="margin:4px 0 0;font-size:10px;color:#AAAAAA;">Please change your password upon your first sign-in.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const plain = `Welcome ${staff.name}!\n\nYou have been invited to EventFlow for "${eventName}".\n\n=== YOUR LOGIN CREDENTIALS ===\nLogin URL: ${loginUrl}\nUsername (Email): ${staff.email}\nTemporary Password: ${tempPass}\nAccess Role: ${roleText}\nAssigned Event: ${eventName}\n\nPlease change your temporary password after logging in.\n\nEventFlow Team`;

  return sendEmail({
    type: 'staff_invite',
    fromAddress: FROM_EMAIL,
    fromName: FROM_NAME,
    toAddress: staff.email,
    toName: staff.name,
    subject: `Staff Login Credentials - ${eventName}`,
    html,
    plain,
  });
}

export const sendStaffInviteEmail = sendStaffInvite;
