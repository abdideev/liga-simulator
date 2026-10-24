// Legal texts shown and accepted inside the platform (Entregable 8, Anexos A–E).
//
// They are academic templates: the fields in [brackets] are completed by the
// Municipio or by A&I before going live, and the whole package must be
// reviewed by a lawyer (decision D8). Each document has a version; the exact
// text of that version is hashed (SHA-256) when it is shown or accepted, so a
// record can later prove WHICH text was on screen.

export interface TablaDoc {
  encabezados: string[];
  filas: string[][];
}

export interface SeccionDoc {
  titulo: string;
  parrafos?: string[];
  lista?: string[];
  tabla?: TablaDoc;
}

export type DocumentoLegalId =
  | "aviso"
  | "avisoSimplificado"
  | "terminos"
  | "condiciones"
  | "consentimiento";

export interface DocumentoLegal {
  id: DocumentoLegalId;
  titulo: string;
  version: string;
  /** Short line under the title: who the parties are and how it is accepted. */
  descripcion: string;
  secciones: SeccionDoc[];
}

// ---------------------------------------------------------------------------
// Anexo A · Aviso de privacidad integral
// ---------------------------------------------------------------------------

export const AVISO_PRIVACIDAD: DocumentoLegal = {
  id: "aviso",
  titulo: "Aviso de privacidad integral",
  version: "1.0",
  descripcion:
    "Responsable: Municipio de Tulancingo de Bravo, Hidalgo. Encargada: A&I Software, S. de R.L. de C.V.",
  secciones: [
    {
      titulo: "1. ¿Quién es responsable de sus datos personales?",
      parrafos: [
        "El Municipio de Tulancingo de Bravo, Hidalgo, por conducto de [dependencia a cargo del deporte municipal], con domicilio en [domicilio], es el responsable del tratamiento de los datos personales que usted proporcione en esta plataforma.",
        "A&I Software, S. de R.L. de C.V., con domicilio en [domicilio], es la persona encargada: trata sus datos únicamente por cuenta del Municipio, bajo sus instrucciones y conforme al Convenio de Encargo de Tratamiento de Datos Personales firmado entre ambos.",
      ],
    },
    {
      titulo: "2. ¿Qué datos personales recabamos?",
      tabla: {
        encabezados: ["Categoría", "Datos", "De quién"],
        filas: [
          ["Identificación y contacto", "Nombre completo, correo electrónico y teléfono.", "Administradores, delegados, árbitros y tutores."],
          ["Del jugador", "Nombre completo, fecha de nacimiento, CURP, posición, dorsal, equipo y categoría. De la CURP se obtienen la fecha de nacimiento y el sexo registrado, para verificar la elegibilidad por categoría.", "Jugadores mayores de edad y, por conducto de su tutor, menores de edad."],
          ["Del tutor", "Nombre, correo, teléfono, parentesco y declaración de que ejerce la patria potestad o tutela.", "Padre, madre o tutor de un jugador menor de edad."],
          ["Deportivos", "Participación en partidos, goles, tarjetas, faltas, esquinas y suspensiones.", "Jugadores."],
          ["Técnicos", "Dirección IP, tipo de dispositivo y navegador, y fecha y hora de inicios de sesión y aceptaciones, para seguridad y bitácora.", "Todos los usuarios."],
        ],
      },
      parrafos: [
        "No pedimos datos personales sensibles (salud, origen étnico, religión, opiniones políticas, vida sexual u otros), ni domicilio, RFC, fotografías o datos financieros de los jugadores.",
      ],
    },
    {
      titulo: "3. ¿Para qué usamos sus datos?",
      parrafos: ["Finalidades necesarias (sin ellas no podemos prestar el servicio):"],
      lista: [
        "crear y administrar su cuenta;",
        "inscribir equipos y jugadores en la liga;",
        "verificar la elegibilidad del jugador por edad y categoría;",
        "integrar el calendario, registrar las cédulas de partido y calcular resultados, tabla de posiciones y estadísticas;",
        "aplicar las suspensiones que establece el reglamento de la liga;",
        "atender solicitudes de derechos y reportes de abuso o discriminación; y",
        "mantener la seguridad del sistema, su bitácora de auditoría y la prevención de fraude.",
      ],
    },
    {
      titulo: "3.1 Finalidad que requiere su consentimiento",
      parrafos: [
        "Mostrar su nombre y dorsal en la consulta pública de resultados y estadísticas. Puede negarse sin perder el servicio. En el caso de personas menores de edad solo se hace con el consentimiento del tutor; si no lo otorga, se muestra únicamente el dorsal.",
        "No usaremos sus datos para publicidad, perfilamiento comercial ni para venderlos o cederlos a patrocinadores u otros terceros.",
      ],
    },
    {
      titulo: "4. ¿Con quién compartimos sus datos?",
      parrafos: [
        "No transferimos sus datos a terceros para fines propios de ellos. Intervienen únicamente proveedores de infraestructura que tratan datos por cuenta del Municipio y que están autorizados por escrito: Supabase (base de datos, autenticación y respaldos) y Vercel (alojamiento de la aplicación web, que puede registrar datos técnicos de conexión como la IP). Podremos entregar datos a una autoridad competente cuando una ley o una orden fundada y motivada lo exijan.",
      ],
    },
    {
      titulo: "5. ¿Dónde se guardan y cómo se protegen?",
      parrafos: [
        "Sus datos se guardan en una base de datos PostgreSQL administrada, en servidores ubicados en [región por definir], con respaldos diarios automatizados. Aplicamos, entre otras, estas medidas:",
      ],
      lista: [
        "conexión cifrada (HTTPS) y CURP cifrada en reposo y enmascarada en pantalla;",
        "acceso por roles: cada equipo ve solo su información y ningún usuario ajeno puede ver los datos de personas menores de edad;",
        "bitácora de auditoría de las modificaciones y de las consultas a perfiles de menores;",
        "verificación en dos pasos para administradores; y",
        "en el teléfono del árbitro, una copia temporal mínima (nombre, dorsal y equipo) para capturar la cédula sin conexión, que se elimina al sincronizar.",
      ],
    },
    {
      titulo: "6. ¿Por cuánto tiempo conservamos sus datos?",
      tabla: {
        encabezados: ["Dato", "Plazo"],
        filas: [
          ["Cuenta de usuario", "Mientras la liga esté activa y hasta 12 meses después de su última temporada."],
          ["CURP, fecha de nacimiento y contacto", "Durante la temporada. Al terminar se suprimen, salvo lo que el reglamento obligue a conservar (por ejemplo, una sanción vigente)."],
          ["Datos de personas menores de edad", "Durante la temporada. Al terminar se suprimen o se disocian para que ya no identifiquen a la persona."],
          ["Resultados y estadísticas históricas", "Se conservan, sin datos que identifiquen a personas menores de edad."],
          ["Constancias de aceptación electrónica", "Diez años, como prueba de la contratación."],
          ["Respaldos", "Se renuevan cada [30] días; un dato suprimido desaparece de los respaldos en ese plazo."],
        ],
      },
      parrafos: [
        "Cuando usted cancela un dato, primero se bloquea (se conserva sin usarlo, solo para determinar responsabilidades) y después se suprime.",
      ],
    },
    {
      titulo: "7. Sus derechos ARCO, portabilidad y revocación",
      parrafos: [
        "Usted puede acceder a sus datos, rectificarlos, solicitar su cancelación, oponerse a su tratamiento por causa legítima o a decisiones automatizadas que le afecten, pedir una copia en formato estructurado y revocar los consentimientos que haya dado, sin efectos retroactivos. Si el titular es menor de edad, los ejerce su tutor.",
        "Puede hacerlo desde «Mi cuenta › Derechos ARCO» o por escrito ante la Unidad de Transparencia del Municipio, en [domicilio y correo]. Responderemos en un máximo de veinte días hábiles, ampliable una vez. Es gratuito, salvo costos de reproducción o envío. Toda decisión de elegibilidad automática puede someterse a revisión humana.",
      ],
    },
    {
      titulo: "8. Cambios a este aviso",
      parrafos: [
        "Cualquier cambio se publicará en la plataforma, con su número de versión y su huella digital, y se le avisará por correo. Si el cambio agrega una finalidad nueva, le pediremos de nuevo su consentimiento.",
      ],
    },
    {
      titulo: "9. Autoridad y contacto",
      parrafos: [
        "Si considera vulnerado su derecho a la protección de datos personales, puede acudir ante la autoridad garante competente: a nivel federal, la Secretaría Anticorrupción y Buen Gobierno y, en el ámbito del Municipio, el órgano garante local que corresponda [por confirmar].",
        "Unidad de Transparencia del Municipio: [domicilio, correo y teléfono]. Contacto de privacidad de A&I: [correo].",
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Anexo A.2 · Aviso simplificado (shown on screen before any capture)
// ---------------------------------------------------------------------------

export const AVISO_SIMPLIFICADO: DocumentoLegal = {
  id: "avisoSimplificado",
  titulo: "Aviso de privacidad simplificado",
  version: "1.0",
  descripcion: "Se muestra en pantalla antes de capturar cualquier dato.",
  secciones: [
    {
      titulo: "Aviso de privacidad",
      parrafos: [
        "El Municipio de Tulancingo es responsable de sus datos personales; A&I Software los trata por su cuenta. Los usaremos para administrar su cuenta, inscribir equipos y jugadores, verificar elegibilidad, registrar partidos y estadísticas, y atender sus derechos. No los venderemos ni los usaremos para publicidad. Puede negarse a que su nombre se muestre en la consulta pública (en menores, decide el tutor). Ejerza sus derechos en «Mi cuenta» o ante la Unidad de Transparencia del Municipio. Consulte el aviso integral en la sección «Privacidad».",
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Anexo E · Términos de uso del usuario (Capa 3)
// ---------------------------------------------------------------------------

export const TERMINOS_USO: DocumentoLegal = {
  id: "terminos",
  titulo: "Términos de uso de la plataforma",
  version: "1.0",
  descripcion:
    "Entre A&I Software y cada usuario (administradores, delegados, árbitros, tutores y jugadores). Se aceptan con una casilla en el primer inicio de sesión.",
  secciones: [
    {
      titulo: "1. Qué son estos términos",
      parrafos: [
        "Son las reglas para usar el Sistema de Gestión de la Liga Municipal de Tulancingo (la «Plataforma»), que la liga contrató con A&I Software, S. de R.L. de C.V. («A&I»). Al marcar la casilla «Acepto los Términos de uso» usted los acepta como un contrato de adhesión; la Plataforma registra la versión, la fecha y la hora de su aceptación (Código de Comercio, arts. 80 y 89).",
      ],
    },
    {
      titulo: "2. Su cuenta",
      lista: [
        "Es personal e intransferible y sus datos deben ser verdaderos.",
        "Usted custodia su contraseña y avisa de inmediato cualquier uso no autorizado. Lo que se haga con sus credenciales se presume hecho por usted (Código de Comercio, art. 90).",
        "Los administradores entran con verificación en dos pasos.",
      ],
    },
    {
      titulo: "3. Qué puede hacer según su rol",
      tabla: {
        encabezados: ["Rol", "Puede"],
        filas: [
          ["Administrador", "Configurar la liga, categorías y calendario; cerrar actas; resolver revisiones y protestas."],
          ["Delegado", "Inscribir y consultar el plantel de su equipo, convocar y confirmar o protestar el acta."],
          ["Árbitro", "Capturar la cédula de los partidos que tiene asignados."],
          ["Tutor", "Inscribir a su menor y decidir sobre sus consentimientos."],
          ["Jugador mayor de edad", "Confirmar sus datos y decidir si su nombre aparece en la consulta pública."],
        ],
      },
    },
    {
      titulo: "4. Uso aceptable",
      parrafos: ["Está prohibido:"],
      lista: [
        "acceder a cuentas o datos ajenos, eludir la seguridad o extraer datos de forma masiva;",
        "capturar datos falsos o de otra persona (por ejemplo, una CURP ajena);",
        "usar los datos de jugadores, en especial de menores, fuera de la operación de la liga: contactarlos por otros medios, publicarlos o compartirlos;",
        "cargar o difundir contenido ilícito, discriminatorio o íntimo sin consentimiento; y",
        "copiar, descompilar o aplicar ingeniería inversa a la Plataforma (Ley Federal del Derecho de Autor, art. 106).",
      ],
    },
    {
      titulo: "5. Personas menores de edad",
      lista: [
        "Solo su padre, madre o tutor puede inscribirlas y otorgar o retirar consentimientos.",
        "Sus datos solo los ven el administrador de la liga y el delegado de su equipo.",
        "No existe mensajería directa entre personas adultas y menores dentro de la Plataforma.",
        "En la consulta pública solo aparece su dorsal, salvo que el tutor autorice mostrar el nombre.",
      ],
    },
    {
      titulo: "6. Reglas automáticas y revisión humana",
      parrafos: [
        "La Plataforma calcula la elegibilidad, las suspensiones y la tabla con las reglas que fija la liga. Nunca rechaza a nadie por sí sola: los casos dudosos se marcan como «revisión requerida» y los resuelve una persona con un motivo escrito. Usted puede oponerse a una decisión automatizada que le afecte (LFPDPPP, art. 26, fr. II).",
      ],
    },
    {
      titulo: "7. Datos personales",
      parrafos: [
        "El tratamiento de sus datos se rige por el aviso de privacidad, que la Plataforma le muestra antes de registrarse y que puede consultar en todo momento en la sección «Privacidad». El Municipio es el responsable y A&I la encargada.",
      ],
    },
    {
      titulo: "8. Propiedad intelectual",
      parrafos: [
        "La Plataforma, su código y sus marcas son de A&I. Usted recibe un permiso de uso personal, limitado al tiempo en que la liga tenga contratado el servicio. Los datos de la liga son de la liga.",
      ],
    },
    {
      titulo: "9. Suspensión y baja de la cuenta",
      parrafos: [
        "A&I o el administrador pueden suspender una cuenta por riesgo de seguridad, contenido ilícito o conducta discriminatoria, con aviso del motivo; usted puede inconformarse ante el administrador. Usted puede pedir la baja de su cuenta desde «Mi cuenta»: sus datos se bloquean y después se suprimen conforme al aviso de privacidad; los resultados de los partidos se conservan sin datos que lo identifiquen.",
      ],
    },
    {
      titulo: "10. Cambios a estos términos",
      parrafos: [
        "Los cambios se publican en la Plataforma con un nuevo número de versión. Si el cambio es material, se le pedirá aceptar de nuevo; si no lo acepta, puede dejar de usar la Plataforma y pedir la baja de su cuenta.",
      ],
    },
    {
      titulo: "11. Ley aplicable y contacto",
      parrafos: [
        "Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Dudas y reportes: [correo de soporte de A&I] o el administrador de su liga.",
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Anexo C · Condiciones de Uso y Licencia (Capa 2, contract with the client)
// ---------------------------------------------------------------------------

export const CONDICIONES_LICENCIA: DocumentoLegal = {
  id: "condiciones",
  titulo: "Condiciones de Uso y Licencia",
  version: "1.0",
  descripcion:
    "Contrato electrónico entre A&I Software y el cliente (el Municipio o una liga privada). Lo acepta en pantalla el representante del cliente, con código de verificación, y genera una constancia.",
  secciones: [
    {
      titulo: "Partes y relación con otros documentos",
      parrafos: [
        "Estas Condiciones de Uso y Licencia (las «Condiciones») son el contrato electrónico entre A&I SOFTWARE, S. DE R.L. DE C.V. («A&I»), con domicilio en [DOMICILIO], y la entidad identificada en la Constancia de Aceptación («EL CLIENTE»), representada por la persona que las acepta.",
        "Cuando EL CLIENTE sea el Municipio de Tulancingo, estas Condiciones complementan el Contrato de Prestación de Servicios con Licencia de Uso de Software y sus Anexos A (nivel de servicio) y B (encargo de tratamiento de datos personales); si hubiera contradicción, prevalece el contrato firmado. Cuando EL CLIENTE sea una liga privada, estas Condiciones, el Convenio de Encargo de Tratamiento y la hoja de pedido aceptada son el contrato completo.",
      ],
    },
    {
      titulo: "1. Definiciones",
      parrafos: [
        "«Plataforma» es el Sistema de Gestión de la Liga Municipal de Tulancingo. «Usuarios» son las personas que EL CLIENTE autoriza a usarla: administradores, delegados, árbitros, tutores y jugadores. «Temporada» es el periodo de competencia de la liga. «Datos de la Liga» son el padrón de equipos y jugadores, las cédulas de partido y las estadísticas. «Constancia de Aceptación» es el documento electrónico que registra la aceptación de estas Condiciones.",
      ],
    },
    {
      titulo: "2. Aceptación electrónica y perfeccionamiento",
      parrafos: [
        "EL CLIENTE manifiesta su consentimiento expreso al marcar las casillas de aceptación y confirmar con el código de verificación enviado a su correo. El contrato se perfecciona cuando A&I recibe la aceptación (Código de Comercio, art. 80). LAS PARTES reconocen que esta aceptación produce los mismos efectos que la firma autógrafa (Código de Comercio, arts. 89 y 93; Código Civil Federal, art. 1803); que los mensajes enviados con las claves de una persona se presumen suyos (art. 90); y que la Constancia de Aceptación y la bitácora de A&I hacen prueba (art. 1298-A).",
      ],
    },
    {
      titulo: "3. Facultades del representante",
      parrafos: [
        "Quien acepta declara bajo protesta de decir verdad que tiene facultades para obligar a EL CLIENTE y que los datos proporcionados son verdaderos. A&I podrá pedir el documento que lo acredite. Si no tuviera las facultades, la aceptación no obligará a EL CLIENTE y A&I podrá suspender el acceso.",
      ],
    },
    {
      titulo: "4. Licencia",
      parrafos: [
        "A&I concede a EL CLIENTE una licencia de uso no exclusiva, intransferible y no sublicenciable, limitada al territorio nacional y a la operación de su liga, en modalidad de servicio en línea, por Temporada. Esta licencia no transmite la propiedad de la Plataforma ni el código fuente.",
      ],
    },
    {
      titulo: "5. Restricciones",
      parrafos: [
        "EL CLIENTE y sus Usuarios no podrán: (a) copiar, adaptar, traducir, descompilar ni aplicar ingeniería inversa a la Plataforma (Ley Federal del Derecho de Autor, art. 106); (b) sublicenciar, revender o ceder el acceso; (c) acceder a cuentas o datos ajenos, eludir las medidas de seguridad o extraer datos de forma masiva; (d) cargar software dañino; ni (e) cargar o difundir contenido íntimo sin consentimiento, ni cualquier otro contenido ilícito.",
      ],
    },
    {
      titulo: "6. Uso aceptable de la liga",
      parrafos: [
        "Las categorías y reglas de elegibilidad que EL CLIENTE configure no podrán discriminar. La clasificación por edad es legítima. La Plataforma marca los casos dudosos como «revisión requerida» y deja la resolución, con motivo escrito, al administrador; nunca rechaza automáticamente. Debe existir una vía alterna para acreditar la edad a quien no tenga CURP.",
      ],
    },
    {
      titulo: "7. Datos de la Liga y datos personales",
      parrafos: [
        "Los Datos de la Liga son de EL CLIENTE. Cuando EL CLIENTE sea un sujeto obligado, es el responsable conforme a la Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados y A&I es persona encargada conforme al Anexo B del contrato; cuando sea un particular, es responsable conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares. EL CLIENTE pone a disposición el aviso de privacidad, recaba los consentimientos con la Plataforma, usa los datos solo para operar su liga y no los exporta para venta, patrocinio o publicidad. A&I trata los datos solo por cuenta de EL CLIENTE, no los usa para fines propios, avisa de cualquier vulneración en un máximo de 24 horas y solo subcontrata a los subencargados autorizados: Supabase y Vercel.",
      ],
    },
    {
      titulo: "8. Precio y facturación",
      parrafos: [
        "El precio de la licencia es de $500.00 (quinientos pesos 00/100 M.N.) por equipo inscrito por Temporada, más IVA. No incluye el desarrollo ni la configuración inicial. A&I emitirá factura electrónica.",
      ],
    },
    {
      titulo: "9. Nivel de servicio",
      parrafos: [
        "A&I garantiza una disponibilidad mensual de 99.0 %, excluido el mantenimiento programado, que se avisa con 48 horas de anticipación y no se programa en sábado ni domingo. Severidades, tiempos y créditos (con tope de 30 % del canon de la Temporada) son los del Anexo A del contrato.",
      ],
    },
    {
      titulo: "10. Seguridad y credenciales",
      parrafos: [
        "Cada Usuario custodia sus credenciales y avisa de inmediato cualquier uso no autorizado. A&I podrá exigir verificación en dos pasos a los administradores. Los actos realizados con las credenciales de un Usuario se presumen suyos.",
      ],
    },
    {
      titulo: "11. Propiedad intelectual",
      parrafos: [
        "A&I es titular de los derechos de autor sobre la Plataforma, su código, arquitectura y documentación, y de sus marcas. EL CLIENTE conserva sus derechos sobre los Datos de la Liga. Esta licencia no es exclusiva: A&I puede ofrecer el mismo sistema a otros clientes.",
      ],
    },
    {
      titulo: "12. Custodia del código fuente",
      parrafos: [
        "A&I depositará una copia del código fuente con un tercero de custodia, que la liberará a favor de EL CLIENTE únicamente si A&I cesa operaciones o incumple de forma reiterada y no subsanada el nivel de servicio. La liberación permite la continuidad operativa y no transmite derechos de propiedad intelectual.",
      ],
    },
    {
      titulo: "13. Confidencialidad y transparencia",
      parrafos: [
        "LAS PARTES mantendrán confidencial la información técnica, operativa o administrativa a la que accedan, durante [tres] años después de terminado el contrato. Esta cláusula no limita las obligaciones de transparencia de EL CLIENTE cuando sea un sujeto obligado: el contrato podrá publicarse en versión pública.",
      ],
    },
    {
      titulo: "14. Limitación de responsabilidad",
      parrafos: [
        "La responsabilidad máxima acumulada de A&I no excederá lo facturado por la licencia en la Temporada en que ocurran los hechos. No aplica en casos de dolo o mala fe, ni a lo que la ley no permita limitar.",
      ],
    },
    {
      titulo: "15. Modificaciones",
      parrafos: [
        "A&I podrá actualizar estas Condiciones y el aviso de privacidad avisando con 30 días naturales de anticipación. Los cambios materiales (nuevas finalidades, cesiones o cambios de precio) requerirán una nueva aceptación electrónica. Si EL CLIENTE no los acepta, podrá terminar el contrato al concluir la Temporada en curso, sin penalización. A&I conservará todas las versiones anteriores.",
      ],
    },
    {
      titulo: "16. Vigencia, renovación y cancelación del plan",
      parrafos: [
        "La licencia dura una Temporada y se renueva automáticamente por Temporadas sucesivas, salvo aviso de terminación con al menos [treinta] días naturales de anticipación al inicio de la siguiente. EL CLIENTE puede dar ese aviso desde «Mi cuenta › Plan y licencia»; el servicio sigue activo hasta el fin de la Temporada en curso y no se cobra la siguiente.",
      ],
    },
    {
      titulo: "17. Suspensión, terminación y entrega de datos",
      parrafos: [
        "Cualquiera de LAS PARTES podrá terminar el contrato por incumplimiento grave no subsanado dentro de [quince] días naturales siguientes a la notificación. A&I podrá suspender de inmediato una cuenta por riesgo de seguridad, contenido ilícito o conducta discriminatoria. Al terminar, A&I entregará los Datos de la Liga en formato abierto y estructurado y los suprimirá, incluidos los respaldos al vencer su ciclo, con confirmación por escrito, salvo obligación legal de conservarlos.",
      ],
    },
    {
      titulo: "18. Notificaciones y conservación",
      parrafos: [
        "Las notificaciones se harán al correo registrado en la Constancia de Aceptación y serán válidas como mensajes de datos. LAS PARTES conservarán íntegros y accesibles los mensajes y la Constancia por diez años (Código de Comercio, art. 49).",
      ],
    },
    {
      titulo: "19. Ley aplicable y jurisdicción",
      parrafos: [
        "Estas Condiciones se rigen por las leyes de los Estados Unidos Mexicanos. LAS PARTES se someten a los tribunales competentes de [ENTIDAD FEDERATIVA].",
      ],
    },
    {
      titulo: "20. Integridad",
      parrafos: [
        "Estas Condiciones, el aviso de privacidad, el Convenio de Encargo de Tratamiento y, en su caso, la hoja de pedido y el contrato principal forman un solo acuerdo.",
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Anexo B · Consentimiento del tutor (screen texts of the enrollment form)
// ---------------------------------------------------------------------------

export const CONSENTIMIENTO_TUTOR: DocumentoLegal = {
  id: "consentimiento",
  titulo: "Consentimiento del padre, madre o tutor",
  version: "1.0",
  descripcion:
    "Textos del formulario de inscripción de un jugador menor de edad. Las casillas llegan vacías y se marcan por separado.",
  secciones: [
    {
      titulo: "Declaración",
      parrafos: [
        "Declaro bajo protesta de decir verdad que soy [madre / padre / tutor] de [nombre del menor] y que ejerzo la patria potestad o la tutela sobre esta persona menor de edad.",
      ],
    },
    {
      titulo: "Consentimiento 1 (obligatorio para inscribir)",
      parrafos: [
        "Consiento que el Municipio de Tulancingo y A&I Software, como encargada, traten los datos personales de [nombre del menor] (nombre, fecha de nacimiento, CURP, posición, dorsal, equipo y estadísticas de juego) y los míos como tutor (nombre, correo, teléfono y parentesco), para inscribirlo en la liga, verificar su elegibilidad por edad y categoría, registrar sus partidos y estadísticas, y mantener la seguridad del sistema.",
      ],
    },
    {
      titulo: "Consentimiento 2 (opcional)",
      parrafos: [
        "Consiento que el nombre y el dorsal de [nombre del menor] se muestren en la consulta pública de resultados y estadísticas. Si no marco esta casilla, solo se mostrará su dorsal.",
      ],
    },
    {
      titulo: "Lo que debe saber",
      lista: [
        "Nunca se publicará la fecha de nacimiento, la CURP, el domicilio ni el contacto del menor.",
        "Solo el administrador de la liga y el delegado de su equipo pueden ver sus datos.",
        "No existe mensajería directa entre personas adultas y el menor.",
        "Puede consultar, corregir, cancelar o retirar estos consentimientos en cualquier momento.",
      ],
    },
  ],
};

export const DOCUMENTOS: Record<DocumentoLegalId, DocumentoLegal> = {
  aviso: AVISO_PRIVACIDAD,
  avisoSimplificado: AVISO_SIMPLIFICADO,
  terminos: TERMINOS_USO,
  condiciones: CONDICIONES_LICENCIA,
  consentimiento: CONSENTIMIENTO_TUTOR,
};

/** Canonical plain text of a document version: what the SHA-256 is computed over. */
export function textoCanonico(doc: DocumentoLegal): string {
  const partes = [`${doc.titulo} · versión ${doc.version}`, doc.descripcion];
  for (const s of doc.secciones) {
    partes.push(s.titulo);
    s.parrafos?.forEach((p) => partes.push(p));
    s.lista?.forEach((l) => partes.push(`- ${l}`));
    if (s.tabla) {
      partes.push(s.tabla.encabezados.join(" | "));
      s.tabla.filas.forEach((f) => partes.push(f.join(" | ")));
    }
  }
  return partes.join("\n");
}

/** Exact texts of the on-screen checkboxes, stored with each acceptance. */
export const CASILLAS = {
  terminos: `Acepto los Términos de uso de la plataforma (versión ${TERMINOS_USO.version}).`,
  avisoLeido: `Leí el aviso de privacidad (versión ${AVISO_PRIVACIDAD.version}) y sé cómo se tratan mis datos.`,
  condiciones: `He leído y acepto las Condiciones de Uso y Licencia de la Plataforma, versión ${CONDICIONES_LICENCIA.version}.`,
  facultades: (entidad: string) =>
    `Declaro bajo protesta de decir verdad que tengo facultades para obligar a ${entidad}.`,
};
