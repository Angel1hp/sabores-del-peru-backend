import SibApiV3Sdk from "sib-api-v3-sdk";

const client = SibApiV3Sdk.ApiClient.instance;

// API KEY desde Render
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

// API transaccional
const api = new SibApiV3Sdk.TransactionalEmailsApi();

// ============================
// EMAIL BIENVENIDA
// ============================
export const enviarEmailBienvenida = async (destinatario, nombreCompleto) => {
  try {
    await api.sendTransacEmail({
      sender: {
        name: "Raíces Restaurant",
        email: process.env.EMAIL_FROM
      },
      to: [{ email: destinatario }],
      subject: "🎉 ¡Bienvenido a Raíces Restaurant!",
      htmlContent: `<h2>Hola ${nombreCompleto}</h2><p>Tu cuenta fue creada correctamente.</p>`
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Brevo API error:", error.message);
    return { success: false, error: error.message };
  }
};

// ============================
// EMAIL CONFIRMACIÓN PEDIDO
// ============================
export const enviarEmailConfirmacionPedido = async (
  destinatario,
  nombreCliente,
  ordenId,
  numeroComprobante,
  items,
  total
) => {
  try {
    await api.sendTransacEmail({
      sender: {
        name: "Raíces Restaurant",
        email: process.env.EMAIL_FROM
      },
      to: [{ email: destinatario }],
      subject: `✅ Pedido #${ordenId} confirmado`,
      htmlContent: `
        <p>Hola ${nombreCliente}</p>
        <p>Pedido #${ordenId}</p>
        <p>Comprobante: ${numeroComprobante}</p>
        <p>Total: S/ ${total}</p>
      `
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Brevo API error:", error.message);
    return { success: false, error: error.message };
  }
};
