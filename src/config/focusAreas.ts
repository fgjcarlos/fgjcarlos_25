export interface FocusArea {
  title: string;
  description: string;
}

/** Áreas de trabajo: home (cine-scroll) y detalle de perfil. */
export const focusAreas: FocusArea[] = [
  {
    title: "Software industrial",
    description:
      "Aplicaciones web, APIs, WebSockets y dashboards para procesos industriales y operación en campo.",
  },
  {
    title: "Integración IT/OT",
    description:
      "Conexión entre máquinas, sensores, bases de datos y sistemas web usando protocolos industriales.",
  },
  {
    title: "IoT, visión y edge",
    description:
      "Soluciones con Docker, MQTT, OPC-UA, cámaras, OpenCV y despliegues cercanos al proceso.",
  },
];
