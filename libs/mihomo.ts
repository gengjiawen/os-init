import * as fs from 'fs'
import * as path from 'path'
import { ensureDir } from './utils'

const MIHOMO_CONFIG_TEMPLATE = `mixed-port: 7890
mode: rule
log-level: info
dns:
  enable: true
  ipv6: false
  default-nameserver:
    - 1.1.1.1
    - 223.5.5.5
    - 119.29.29.29
sniffer:
  enable: true
  sniffing:
    - tls
    - http
tun:
  enable: true
  stack: system
  auto-route: true
  auto-redirect: true
  auto-detect-interface: true
proxies:
  - name: socks5-proxy
    type: socks5
    server: your.ip
    port: 6153
proxy-groups:
  - name: PROXY
    type: select
    proxies:
      - socks5-proxy
rules:
  - IP-CIDR,127.0.0.0/8,DIRECT
  - IP-CIDR,10.0.0.0/8,DIRECT
  - IP-CIDR,172.16.0.0/12,DIRECT
  - IP-CIDR,192.168.0.0/16,DIRECT
  - IP-CIDR,169.254.0.0/16,DIRECT
  - IP-CIDR,100.64.0.0/10,DIRECT
  - IP-CIDR6,fc00::/7,DIRECT
  - IP-CIDR6,fe80::/10,DIRECT
  - DOMAIN-SUFFIX,local,DIRECT
  - DOMAIN-SUFFIX,cn,DIRECT
  - GEOIP,CN,DIRECT
  - MATCH,PROXY
`

/** Write Mihomo config.yml */
export function writeMihomoConfig(targetPath?: string): { configPath: string } {
  const configPath = targetPath || path.join(process.cwd(), 'config.yml')
  ensureDir(path.dirname(configPath))
  fs.writeFileSync(configPath, MIHOMO_CONFIG_TEMPLATE)

  return { configPath }
}
