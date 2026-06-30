/**
 * Privacy Policy Content Component
 * Displays the main privacy policy content with support for multiple locales
 */

'use client';

import { useMemo } from 'react';

interface PrivacyPolicyContentProps {
  /**
   * Current locale code (e.g., 'en', 'es', 'fr')
   */
  locale: string;
}

/**
 * Privacy policy content for different locales
 */
const PRIVACY_CONTENT: Record<string, Record<string, string>> = {
  en: {
    introduction: `
      <h2 id="introduction">Introduction</h2>
      <p>
        TeachLink (&quot;we,&quot; &quot;us,&quot; &quot;our,&quot; or &quot;Company&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
      </p>
      <p>
        Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our services.
      </p>
    `,
    informationCollection: `
      <h2 id="information-collection">Information We Collect</h2>
      <h3>Information You Provide Directly</h3>
      <p>We collect information you provide directly, such as:</p>
      <ul>
        <li>Account registration information (name, email, password)</li>
        <li>Profile information (photo, bio, preferences)</li>
        <li>Course content and learning progress</li>
        <li>Communication with other users and support team</li>
        <li>Payment and billing information</li>
      </ul>
      <h3>Information Collected Automatically</h3>
      <p>We automatically collect certain information about your device and usage:</p>
      <ul>
        <li>Browser type and operating system</li>
        <li>IP address and location information</li>
        <li>Pages visited and time spent on pages</li>
        <li>Referral source</li>
        <li>Cookies and similar tracking technologies</li>
      </ul>
    `,
    informationUse: `
      <h2 id="information-use">How We Use Your Information</h2>
      <p>We use the information we collect for:</p>
      <ul>
        <li>Providing and improving our services</li>
        <li>Personalizing your learning experience</li>
        <li>Processing payments and transactions</li>
        <li>Sending service-related announcements</li>
        <li>Responding to your inquiries and support requests</li>
        <li>Conducting research and analytics</li>
        <li>Complying with legal obligations</li>
        <li>Protecting against fraud and security threats</li>
      </ul>
    `,
    dataSecurity: `
      <h2 id="data-security">Data Security</h2>
      <p>
        We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
      </p>
      <ul>
        <li>SSL/TLS encryption for data in transit</li>
        <li>Encryption for sensitive data at rest</li>
        <li>Regular security audits and updates</li>
        <li>Access controls and authentication mechanisms</li>
        <li>Employee training on data protection</li>
      </ul>
      <p>
        However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
      </p>
    `,
    yourRights: `
      <h2 id="your-rights">Your Privacy Rights</h2>
      <p>Depending on your location, you may have the following rights:</p>
      <ul>
        <li><strong>Access:</strong> Request a copy of your personal information</li>
        <li><strong>Correction:</strong> Request corrections to inaccurate information</li>
        <li><strong>Deletion:</strong> Request deletion of your personal information</li>
        <li><strong>Portability:</strong> Receive your information in a portable format</li>
        <li><strong>Opt-out:</strong> Opt-out of marketing communications</li>
        <li><strong>Restriction:</strong> Request restriction of processing</li>
      </ul>
      <p>
        To exercise any of these rights, please contact us at <a href="mailto:privacy@teachlink.com">privacy@teachlink.com</a>.
      </p>
    `,
    contact: `
      <h2 id="contact">Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy or our privacy practices, please contact us at:
      </p>
      <address>
        TeachLink Privacy Team<br />
        Email: <a href="mailto:privacy@teachlink.com">privacy@teachlink.com</a><br />
        Address: [Company Address]<br />
        Phone: [Company Phone]
      </address>
    `,
  },
  es: {
    introduction: `
      <h2 id="introduction">Introducción</h2>
      <p>
        TeachLink (&quot;nosotros,&quot; &quot;nuestro&quot; o &quot;Compañía&quot;) está comprometida con la protección de su privacidad. Esta Política de Privacidad explica cómo recopilamos, utilizamos, divulgamos y salvaguardamos su información cuando visita nuestro sitio web y utiliza nuestros servicios.
      </p>
      <p>
        Por favor, lea esta Política de Privacidad cuidadosamente. Si no está de acuerdo con nuestras políticas y prácticas, no utilice nuestros servicios.
      </p>
    `,
    informationCollection: `
      <h2 id="information-collection">Información que Recopilamos</h2>
      <h3>Información que Proporciona Directamente</h3>
      <p>Recopilamos información que proporciona directamente, como:</p>
      <ul>
        <li>Información de registro de cuenta (nombre, correo electrónico, contraseña)</li>
        <li>Información de perfil (foto, biografía, preferencias)</li>
        <li>Contenido del curso y progreso de aprendizaje</li>
        <li>Comunicación con otros usuarios y equipo de soporte</li>
        <li>Información de pago y facturación</li>
      </ul>
      <h3>Información Recopilada Automáticamente</h3>
      <p>Recopilamos automáticamente cierta información sobre su dispositivo y uso:</p>
      <ul>
        <li>Tipo de navegador y sistema operativo</li>
        <li>Dirección IP e información de ubicación</li>
        <li>Páginas visitadas y tiempo dedicado en las páginas</li>
        <li>Fuente de referencia</li>
        <li>Cookies y tecnologías de seguimiento similares</li>
      </ul>
    `,
    informationUse: `
      <h2 id="information-use">Cómo Usamos Su Información</h2>
      <p>Utilizamos la información que recopilamos para:</p>
      <ul>
        <li>Proporcionar y mejorar nuestros servicios</li>
        <li>Personalizar su experiencia de aprendizaje</li>
        <li>Procesar pagos y transacciones</li>
        <li>Enviar anuncios relacionados con el servicio</li>
        <li>Responder a sus consultas y solicitudes de soporte</li>
        <li>Realizar investigación y análisis</li>
        <li>Cumplir con obligaciones legales</li>
        <li>Proteger contra fraude y amenazas de seguridad</li>
      </ul>
    `,
    dataSecurity: `
      <h2 id="data-security">Seguridad de Datos</h2>
      <p>
        Implementamos medidas técnicas y organizacionales apropiadas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción. Estas medidas incluyen:
      </p>
      <ul>
        <li>Cifrado SSL/TLS para datos en tránsito</li>
        <li>Cifrado para datos sensibles en reposo</li>
        <li>Auditorías de seguridad y actualizaciones regulares</li>
        <li>Controles de acceso y mecanismos de autenticación</li>
        <li>Capacitación de empleados en protección de datos</li>
      </ul>
      <p>
        Sin embargo, ningún método de transmisión por Internet es 100% seguro. Aunque nos esforzamos por proteger su información, no podemos garantizar una seguridad absoluta.
      </p>
    `,
    yourRights: `
      <h2 id="your-rights">Sus Derechos de Privacidad</h2>
      <p>Dependiendo de su ubicación, puede tener los siguientes derechos:</p>
      <ul>
        <li><strong>Acceso:</strong> Solicitar una copia de su información personal</li>
        <li><strong>Corrección:</strong> Solicitar correcciones a información inexacta</li>
        <li><strong>Eliminación:</strong> Solicitar la eliminación de su información personal</li>
        <li><strong>Portabilidad:</strong> Recibir su información en un formato portable</li>
        <li><strong>Exclusión:</strong> Excluirse de comunicaciones de marketing</li>
        <li><strong>Restricción:</strong> Solicitar restricción del procesamiento</li>
      </ul>
      <p>
        Para ejercer cualquiera de estos derechos, contáctenos en <a href="mailto:privacy@teachlink.com">privacy@teachlink.com</a>.
      </p>
    `,
    contact: `
      <h2 id="contact">Contáctenos</h2>
      <p>
        Si tiene preguntas sobre esta Política de Privacidad o nuestras prácticas de privacidad, contáctenos en:
      </p>
      <address>
        Equipo de Privacidad de TeachLink<br />
        Correo electrónico: <a href="mailto:privacy@teachlink.com">privacy@teachlink.com</a><br />
        Dirección: [Dirección de la Compañía]<br />
        Teléfono: [Teléfono de la Compañía]
      </address>
    `,
  },
  fr: {
    introduction: `
      <h2 id="introduction">Introduction</h2>
      <p>
        TeachLink (&quot;nous,&quot; &quot;notre&quot; ou &quot;Société&quot;) s'engage à protéger votre vie privée. Cette Politique de Confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous visitez notre site web et utilisez nos services.
      </p>
      <p>
        Veuillez lire attentivement cette Politique de Confidentialité. Si vous n'êtes pas d'accord avec nos politiques et pratiques, veuillez ne pas utiliser nos services.
      </p>
    `,
    informationCollection: `
      <h2 id="information-collection">Informations que nous collectons</h2>
      <h3>Informations que vous fournissez directement</h3>
      <p>Nous collectons les informations que vous fournissez directement, telles que:</p>
      <ul>
        <li>Informations d'enregistrement de compte (nom, e-mail, mot de passe)</li>
        <li>Informations de profil (photo, biographie, préférences)</li>
        <li>Contenu du cours et progression d'apprentissage</li>
        <li>Communication avec d'autres utilisateurs et l'équipe d'assistance</li>
        <li>Informations de paiement et de facturation</li>
      </ul>
      <h3>Informations collectées automatiquement</h3>
      <p>Nous collectons automatiquement certaines informations sur votre appareil et votre utilisation:</p>
      <ul>
        <li>Type de navigateur et système d'exploitation</li>
        <li>Adresse IP et informations de localisation</li>
        <li>Pages visitées et temps passé sur les pages</li>
        <li>Source de référence</li>
        <li>Cookies et technologies de suivi similaires</li>
      </ul>
    `,
    informationUse: `
      <h2 id="information-use">Comment nous utilisons vos informations</h2>
      <p>Nous utilisons les informations que nous collectons pour:</p>
      <ul>
        <li>Fournir et améliorer nos services</li>
        <li>Personnaliser votre expérience d'apprentissage</li>
        <li>Traiter les paiements et les transactions</li>
        <li>Envoyer des annonces relatives au service</li>
        <li>Répondre à vos questions et demandes d'assistance</li>
        <li>Mener des recherches et des analyses</li>
        <li>Respecter les obligations légales</li>
        <li>Protéger contre la fraude et les menaces de sécurité</li>
      </ul>
    `,
    dataSecurity: `
      <h2 id="data-security">Sécurité des données</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos informations personnelles contre l'accès, la modification, la divulgation ou la destruction non autorisés. Ces mesures incluent:
      </p>
      <ul>
        <li>Chiffrement SSL/TLS pour les données en transit</li>
        <li>Chiffrement pour les données sensibles au repos</li>
        <li>Audits de sécurité et mises à jour régulières</li>
        <li>Contrôles d'accès et mécanismes d'authentification</li>
        <li>Formation des employés à la protection des données</li>
      </ul>
      <p>
        Cependant, aucune méthode de transmission sur Internet n'est 100% sécurisée. Bien que nous nous efforcions de protéger vos informations, nous ne pouvons pas garantir une sécurité absolue.
      </p>
    `,
    yourRights: `
      <h2 id="your-rights">Vos droits en matière de confidentialité</h2>
      <p>Selon votre localisation, vous pouvez avoir les droits suivants:</p>
      <ul>
        <li><strong>Accès:</strong> Demander une copie de vos informations personnelles</li>
        <li><strong>Correction:</strong> Demander des corrections aux informations inexactes</li>
        <li><strong>Suppression:</strong> Demander la suppression de vos informations personnelles</li>
        <li><strong>Portabilité:</strong> Recevoir vos informations dans un format portable</li>
        <li><strong>Exclusion:</strong> Vous exclure des communications marketing</li>
        <li><strong>Restriction:</strong> Demander une restriction du traitement</li>
      </ul>
      <p>
        Pour exercer l'un de ces droits, veuillez nous contacter à <a href="mailto:privacy@teachlink.com">privacy@teachlink.com</a>.
      </p>
    `,
    contact: `
      <h2 id="contact">Nous contacter</h2>
      <p>
        Si vous avez des questions sur cette Politique de Confidentialité ou sur nos pratiques de confidentialité, veuillez nous contacter à:
      </p>
      <address>
        Équipe de Confidentialité TeachLink<br />
        E-mail: <a href="mailto:privacy@teachlink.com">privacy@teachlink.com</a><br />
        Adresse: [Adresse de l'Entreprise]<br />
        Téléphone: [Téléphone de l'Entreprise]
      </address>
    `,
  },
};

/**
 * Privacy Policy Content Component
 */
export function PrivacyPolicyContent({ locale }: PrivacyPolicyContentProps) {
  const content = useMemo(() => {
    return PRIVACY_CONTENT[locale] || PRIVACY_CONTENT.en;
  }, [locale]);

  return (
    <>
      <section
        className="space-y-8 text-gray-700"
        dangerouslySetInnerHTML={{
          __html: `
            ${content.introduction}
            ${content.informationCollection}
            ${content.informationUse}
            ${content.dataSecurity}
            ${content.yourRights}
            ${content.contact}
          `,
        }}
      />
    </>
  );
}
