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
| 项目 | `jianlai-tech`（创建后填 id） |
| Git | `ShukriChiu/jianlai-tech` · `main` |
| 加速区域 | 全球可用区（含中国大陆） |
| 根目录 | `apps/jianlai-web` |
| 安装 | `bun install` |
| 构建 | `bun run build` |
| 输出 | `dist` |
| 构建变量 | 生产 API 就绪后加 `VITE_API_BASE_URL` |

控制台已有 `onion-dashboard`、`jpp-aios`。新建项目点「创建项目 → 导入 Git 仓库」。

本期免费构建次数曾见 586/500，超额后新构建可能失败，要升配额或清旧部署。

## 本地对照

```bash
just db-up && just migrate
just dev-api
just dev-web
```
