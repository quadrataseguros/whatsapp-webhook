// Canais de atendimento da Quadrata Seguros — ambos com WhatsApp.
export const CONTATOS = {
  escritorio: {
    label: "Escritório",
    display: "(11) 4782-0888",
    tel: "1147820888",
    whatsapp: "551147820888",
    horario: "Seg–Sex, 8h–18h",
  },
  mariana: {
    label: "MarIAna 24h",
    display: "(11) 98678-0000",
    tel: "11986780000",
    whatsapp: "5511986780000",
    horario: "24 horas, todos os dias",
  },
} as const;

export const EMAIL = "atendimento@quadrataseguros.com";

export const CORRETORA = "Quadrata Seguros";

export const waLink = (numero: string, texto?: string) =>
  `https://wa.me/${numero}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;

export const telLink = (numero: string) => `tel:${numero}`;

export const mailLink = (assunto?: string) =>
  `mailto:${EMAIL}${assunto ? `?subject=${encodeURIComponent(assunto)}` : ""}`;
