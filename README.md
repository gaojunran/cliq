# cliq

使用简单的 JSON 配置生成基于 CLI 的 GUI 程序，方便开发者在不需要手动构建 GUI 的情况下服务小白用户。

![screenshot](image.png)

## 使用方法

TODO

## TODO LIST

- [ ] 补充参数
- [ ] 补充文档
- [ ] 支持数组参数
- [ ] 支持命令参数缓存
- [ ] 支持设置面板
- [ ] 支持命令历史
- [ ] 支持命令转义，确保命令始终正确
- [x] 支持文件路径拖拽
- [x] 代码解耦

## 如何获得 JSON 配置？

### 方法一：借助大模型（推荐）

你可以将 [src/types/types.ts](src/types/types.ts) 连同自己开发的 CLI 工具的参数定义部分，一起提供给大模型，附上以下的提示词：

```
请根据我提供给你的 TypeScript 类型定义，结合我的 CLI 工具的代码，生成一个符合该类型定义的 JSON 配置文件。
```

### 方法二：借助 [usage](https://github.com/jdx/usage) 工具

此项目中使用的 JSON 配置是 [usage](https://github.com/jdx/usage) 导出 JSON 结果的超集。你可以编写 usage 的 KDL 配置文件，然后：

1. 直接将 `foo.usage.kdl` 配置文件放入 `cliq/` 下。此项目会自动转换成合理的 JSON 配置文件。
2. 安装 `usage` 命令行工具，执行 `usage generate json -f cliq/foo.usage.kdl > cliq/foo.cliq.json`，然后手动修改生成的 JSON 文件以自定义。
