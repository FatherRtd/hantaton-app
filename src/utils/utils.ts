import type { Edges, Nodes } from "v-network-graph";

export function convertToPlantUMLWithHostAndTraffic(nodes: Nodes, edges: Edges): string {
  let plantUml = "@startuml\n";
  plantUml += "left to right direction\n";
  plantUml += "skinparam nodesep 40\n";
  plantUml += "skinparam ranksep 60\n";
  plantUml += "skinparam defaultFontName Arial\n\n";

  plantUml += "legend right\n";
  plantUml += "  | Color | TCP Traffic |\n";
  plantUml += "  | <color:#00AA00>Green</color> | < 2000 bytes |\n";
  plantUml += "  | <color:#FFA500>Orange</color> | 2000-4000 bytes |\n";
  plantUml += "  | <color:#FF0000>Red</color> | > 4000 bytes |\n";
  plantUml += "endlegend\n\n";

  Object.entries(nodes).forEach(([key, node]) => {
    const safeKey = key.replace(/[.:]/g, "_");
    const [hostIp, port] = key.split(":");

    plantUml += `node "${node.name}\\n`;
    plantUml += `<size:10>Host: ${hostIp || "N/A"}</size>\\n`;
    plantUml += `<size:10>Port: ${port || "N/A"}</size>" as ${safeKey}\n`;
  });

  plantUml += "\n";
  Object.values(edges).forEach((edge) => {
    const source = edge.source.replace(/[.:]/g, "_");
    const target = edge.target.replace(/[.:]/g, "_");

    let color = "#000000";
    let trafficInfo = "";

    if (edge.traffic?.tcp) {
      const tcpBytes = edge.traffic.tcp.bytes;
      if (tcpBytes < 2000) {
        color = "#00AA00";
      } else if (tcpBytes < 4000) {
        color = "#FFA500";
      } else {
        color = "#FF0000";
      }
      trafficInfo = ` : <color:${color}>${tcpBytes} bytes</color>`;
    }

    plantUml += `${source} -[${color}]-> ${target}${trafficInfo}\n`;
  });

  plantUml += "@enduml";
  return plantUml;
}
