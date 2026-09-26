# 剑来科技部署

前台走腾讯云 EdgeOne Makers。API 后期再接 Railway。默认 `.edgeone.cool` 未绑自定义域时浏览器直开会 401，控制台点「预览」或绑域名。

## 线上地址

| 层 | URL |
|----|-----|
| GitHub | https://github.com/ShukriChiu/jianlai-tech |
| EdgeOne Makers | https://console.cloud.tencent.com/edgeone/makers |
| API | 待接 Railway |

## 腾讯云 EdgeOne Pages

| 项 | 值 |
|----|-----|
| 项目 | `jianlai-tech` · `makers-pxoxlmfaivpn` |
| Git | `ShukriChiu/jianlai-tech` · `main` |
| 加速区域 | 全球可用区（含中国大陆） |
| 根目录 | `apps/jianlai-web` |
| 安装 | `bun install` |
| 构建 | `bun run build` |
| 输出 | `dist` |
| 构建变量 | 生产 API 就绪后加 `VITE_API_BASE_URL` |

项目已在跑，代码源 `jianlai-tech/jianlai-tech` 的 `main`。默认域名 `jianlai-tech-wfgfq1vg.edgeone.cool`。

自定义域 `jianlai.tech` 已在本账号云解析（免费版，4 条记录）。2026-09-26 在域名管理里添加时，控制台提示未在工信部备案，含中国大陆的加速区域加不上去。备案完成后再绑；或把加速区域改成不含中国大陆后再加。

本期免费构建次数曾见 586/500，超额后新构建可能失败，要升配额或清旧部署。

## 本地对照

```bash
just db-up && just migrate
just dev-api
just dev-web
```
