# 参数输入组件

你可以在 JSON 配置中简单地指定 `type` 等参数，来得到适应不同需求的参数输入组件。

## 帮助信息

在输入组件上方有一行帮助信息，包括参数名、是否必填（红色星号）、参数描述、参数帮助等。

- **参数名**：显示参数的 `name` 字段。
- **必填标记**：如果参数的 `required` 字段为 `true`，则显示红色星号。
- **参数描述**：一行内描述参数的用途。展示逻辑如下：

  ```ts
  function getShortHelp(param: Arg | Flag): string | undefined {
    return (
      param.help_first_line ??
      param.help?.split("\n")[0] ??
      param.help_long?.split("\n")[0]
    );
  }
  ````
- **参数帮助**：一个信息图标，悬停时显示参数的详细帮助信息。展示逻辑如下：

  ```ts
  function getLongHelp(param: Arg | Flag): string | undefined {
    // get a longer help than `getShortHelp`
    const shortHelpLength = getShortHelp(param)?.length ?? 0;
    if (param.help_long?.length ?? 0 > shortHelpLength) {
      return param.help_long;
    } else if (param.help && param.help.length > shortHelpLength) {
      return param.help;
    }
    return undefined;
  }
  ```

  注意此函数返回 `undefined` 时表示不需要较长的帮助信息。此时将不显示信息图标。

## 文本框

默认情况下，参数输入组件是一个单行文本框 [InputText](https://primevue.org/inputtext/).

## 多行文本框

你可以给参数指定 `type: "textarea"` 来得到一个多行文本框 [Textarea](https://primevue.org/textarea/). 多行文本框右下角的拖拽柄可以扩展文本框的大小。

## 密码框

你可以给参数指定 `type: "password" ` 来得到一个密码框 [Password](https://primevue.org/password/). 密码框有一个按钮可以切换密码的可见性。

> [!CAUTION]
> 尽管我们提供了该功能，但谨慎使用！开发者有权限获取 Shell 命令的命令内容。尽量不要让密码出现在命令内容中。

## 切换开关

对于一个 Flag，如果你不给其提供 `arg` 参数，将被认为是布尔标志。它将被渲染为一个切换开关 [ToggleSwitch](https://primevue.org/toggleswitch)。

## 选择文件

文本框组件默认就接受文件（夹）拖拽填入路径。如果你想让文本框组件旁边多一个文件（夹）选择框按钮，可以给参数指定 `type: "file"` 或 `type: "dir"`。注意是否允许选择多个文件（夹）将由 `var` 参数控制。
