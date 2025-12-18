# Claude Customer Support Agent
# Claude 客户支持代理

An advanced, fully customizable customer support chat interface powered by Claude and leveraging Amazon Bedrock Knowledge Bases for knowledge retrieval.
一个由 Claude 驱动并利用 Amazon Bedrock 知识库进行知识检索的、先进的、完全可定制的客户支持聊天界面。
![preview](tutorial/preview.png)

## Key Features
## 主要特点

-  AI-powered chat using Anthropic's Claude model
-  使用 Anthropic 的 Claude 模型进行 AI 驱动的聊天
-  Amazon Bedrock integration for contextual knowledge retrieval
-  集成 Amazon Bedrock 以进行上下文知识检索
-  Real-time thinking & debug information display
-  实时显示思考过程和调试信息
-  Knowledge base source visualization
-  知识库来源可视化
-  User mood detection & appropriate agent redirection
-  用户情绪检测和适当的代理重定向
-  Highly customizable UI with shadcn/ui components
-  使用 shadcn/ui 组件构建的高度可定制的用户界面

##  Getting Started
##  入门指南

1. Clone this repository
   克隆此存储库
2. Install dependencies: `npm install`
   安装依赖：`npm install`
3. Set up your environment variables (see Configuration section)
   设置您的环境变量（请参阅配置部分）
4. Run the development server: `npm run dev`
   运行开发服务器：`npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser
   在浏览器中打开 [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuration
## ⚙️ 配置

Create a `.env.local` file in the root directory with the following variables:
在根目录中创建一个 `.env.local` 文件，并包含以下变量：

```
ANTHROPIC_API_KEY=your_anthropic_api_key
BAWS_ACCESS_KEY_ID=your_aws_access_key
BAWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

Note: We are adding a 'B' in front of the AWS environment variables for a reason that will be discussed later in the deployment section.
注意：我们在 AWS 环境变量前添加“B”是有原因的，这将在部署部分稍后讨论。

##  How to Get Your Keys
##  如何获取您的密钥

### Claude API Key
### Claude API 密钥

1. Visit [console.anthropic.com](https://console.anthropic.com/dashboard)
   访问 [console.anthropic.com](https://console.anthropic.com/dashboard)
2. Sign up or log in to your account
   注册或登录您的帐户
3. Click on "Get API keys"
   点击“获取 API 密钥”
4. Copy the key and paste it into your `.env.local` file
   复制密钥并将其粘贴到您的 `.env.local` 文件中

### AWS Access Key and Secret Key
### AWS 访问密钥和秘密密钥

Follow these steps to obtain your AWS credentials:
请按照以下步骤获取您的 AWS 凭证：

1. Log in to the AWS Management Console
   登录 AWS 管理控制台
2. Navigate to the IAM (Identity and Access Management) dashboard
   导航到 IAM（身份和访问管理）仪表板

3. In the left sidebar, click on "Users"
   在左侧边栏中，点击“用户”

4. Click "Create user" and follow the prompts to create a new user
   点击“创建用户”并按照提示创建一个新用户
   ![Add User](tutorial/create-user.png)
5. On the Set Permission page, select the "Attach policies directly" policy
   在设置权限页面，选择“直接附加策略”
   ![Attach Policy](tutorial/attach.png)
5. On the permissions page, use the "AmazonBedrockFullAccess" policy
   在权限页面，使用“AmazonBedrockFullAccess”策略
   ![Attach Policy](tutorial/bedrock.png)
6. Review and create the user
   审查并创建用户
7. On the Summary page, click on Create access key.
   在摘要页面，点击创建访问密钥。
8. Then select "Application running on an AWS compute service". Add a description if desired, then click "Create".
   然后选择“在 AWS 计算服务上运行的应用程序”。如果需要，可以添加描述，然后点击“创建”。
9. You will now see the Access Key ID and Secret Access Key displayed. Note that these keys are only visible once during creation, so be sure to save them securely.
   您现在将看到显示的访问密钥 ID 和秘密访问密钥。请注意，这些密钥在创建过程中只显示一次，因此请务必安全地保存它们。
   ![Access Keys](tutorial/access-keys.png)
8. Copy these keys and paste them into your `.env.local` file
   复制这些密钥并将其粘贴到您的 `.env.local` 文件中

Note: Make sure to keep your keys secure and never share them publicly.
注意：请确保您的密钥安全，切勿公开分享。


##  Amazon Bedrock RAG Integration
##  Amazon Bedrock RAG 集成

This project utilizes Amazon Bedrock for Retrieval-Augmented Generation (RAG). To set up:
该项目利用 Amazon Bedrock 进行检索增强生成（RAG）。设置步骤如下：

1. Ensure you have an AWS account with Bedrock access.
   确保您拥有具有 Bedrock 访问权限的 AWS 账户。
2. Create a Bedrock knowledge base in your desired AWS region.
   在您期望的 AWS 区域中创建一个 Bedrock 知识库。
3. Index your documents/sources in the knowledge base. For more info on that, check the "How to Create Your Own Knowledge Base" section.
   在知识库中为您的文档/来源建立索引。有关更多信息，请查看“如何创建自己的知识库”部分。
4. In `ChatArea.tsx`, update the `knowledgeBases` array with your knowledge base IDs and names:
   在 `ChatArea.tsx` 中，使用您的知识库 ID 和名称更新 `knowledgeBases` 数组：

```typescript
const knowledgeBases: KnowledgeBase[] = [
  { id: "your-knowledge-base-id", name: "Your KB Name" },
  // Add more knowledge bases as needed
];
```

The application will use these knowledge bases for context retrieval during conversations.
应用程序将在对话期间使用这些知识库进行上下文检索。

### How to Create Your Own Knowledge Base
### 如何创建自己的知识库

To create your own knowledge base:
要创建您自己的知识库：

1. Go to your AWS Console and select Amazon Bedrock.
   转到您的 AWS 控制台并选择 Amazon Bedrock。
2. In the left side menu, click on "Knowledge base" under "More".
   在左侧菜单的“更多”下，点击“知识库”。

3. Click on "Create knowledge base".
   点击“创建知识库”。
   ![Create Knowledge Base](tutorial/create-knowledge-base.png)
4. Give your knowledge base a name. You can leave "Create a new service role".
   为您的知识库命名。您可以保留“创建一个新的服务角色”。
5. Choose a source for your knowledge base. In this example, we'll use Amazon S3 storage service.
   为您的知识库选择一个来源。在此示例中，我们将使用 Amazon S3 存储服务。
   ![Choose Source](tutorial/choose-source.png)

   Note: If you're using the S3 storage service, you'll need to create a bucket first where you will upload your files. Alternatively, you can also upload your files after the creation of a knowledge base.
   注意：如果您使用 S3 存储服务，您需要先创建一个存储桶来上传您的文件。或者，您也可以在创建知识库后上传文件。

6. Click "Next".
   点击“下一步”。
7. Choose a location for your knowledge base. This can be S3 buckets, folders, or even single documents.
   为您的知识库选择一个位置。这可以是 S3 存储桶、文件夹，甚至是单个文档。
8. Click "Next".
   点击“下一步”。
9. Select your preferred embedding model. In this case, we'll use Titan Text Embeddings 2.
   选择您偏好的嵌入模型。在这种情况下，我们将使用 Titan Text Embeddings 2。
10. Select "Quick create a new vector store".
    选择“快速创建一个新的向量存储”。
11. Confirm and create your knowledge base.
    确认并创建您的知识库。
12. Once you have done this, get your knowledge base ID from the knowledge base overview.
    完成此操作后，从知识库概览中获取您的知识库 ID。


##  Switching Models
##  切换模型

This project supports multiple Claude models. To switch between models:
该项目支持多种 Claude 模型。要切换模型：

1. In `ChatArea.tsx`, the `models` array defines available models:
   在 `ChatArea.tsx` 中，`models` 数组定义了可用的模型：

```typescript
const models: Model[] = [
  { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
  { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet" },
  // Add more models as needed
];
```

2. The `selectedModel` state variable controls the currently selected model:
   `selectedModel` 状态变量控制当前选择的模型：

```typescript
const [selectedModel, setSelectedModel] = useState("claude-3-haiku-20240307");
```

3. To implement model switching in the UI, a dropdown component is used that updates the `selectedModel`.
   为了在 UI 中实现模型切换，使用了一个下拉组件来更新 `selectedModel`。


##  Customization
##  定制化

This project leverages shadcn/ui components, offering a high degree of customization:
该项目利用 shadcn/ui 组件，提供了高度的定制化：

* Modify the UI components in the `components/ui` directory
* 在 `components/ui` 目录中修改 UI 组件
* Adjust the theme in `app/globals.css`
* 在 `app/globals.css` 中调整主题
* Customize the layout and functionality in individual component files
* 在单个组件文件中定制布局和功能
* Modify the theme colors and styles by editing the `styles/themes.js` file:
* 通过编辑 `styles/themes.js` 文件来修改主题颜色和样式：

```javascript
// styles/themes.js
export const themes = {
  neutral: {
    light: {
      // Light mode colors for neutral theme
    },
    dark: {
      // Dark mode colors for neutral theme
    }
  },
  // Add more themes here
};
```
You can add new themes or modify existing ones by adjusting the color values in this file.
您可以通过调整此文件中的颜色值来添加新主题或修改现有主题。

##  Deploy with AWS Amplify
##  使用 AWS Amplify 部署

To deploy this application using AWS Amplify, follow these steps:
要使用 AWS Amplify 部署此应用程序，请按照以下步骤操作：

1. Go to your AWS Console and select Amplify.
   转到您的 AWS 控制台并选择 Amplify。
2. Click on "Create new app" (image link to be added later).
   点击“创建新应用”（图片链接稍后添加）。
3. Select GitHub (or your preferred provider) as the source.
   选择 GitHub（或您偏好的提供商）作为来源。
4. Choose this repository.
   选择此存储库。
5. Edit the YAML file to contain:
   编辑 YAML 文件以包含：

   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci --cache .npm --prefer-offline
       build:
         commands:
           - npm run build # Next.js build runs first
           - echo "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY" >> .env
           - echo "KNOWLEDGE_BASE_ID=$KNOWLEDGE_BASE_ID" >> .env
           - echo "BAWS_ACCESS_KEY_ID=$BAWS_ACCESS_KEY_ID" >> .env
           - echo "BAWS_SECRET_ACCESS_KEY=$BAWS_SECRET_ACCESS_KEY" >> .env
     artifacts:
       baseDirectory: .next
       files:
         - "**/*"
     cache:
       paths:
         - .next/cache/**/*
         - .npm/**/*
   ```

6. Choose to create a new service role or use an existing one. Refer to the "Service Role" section for more information.
   选择创建新服务角色或使用现有角色。有关更多信息，请参阅“服务角色”部分。
7. Click on "Advanced settings" and add your environmental variables:
   点击“高级设置”并添加您的环境变量：

   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key
   BAWS_ACCESS_KEY_ID=your_aws_access_key
   BAWS_SECRET_ACCESS_KEY=your_aws_secret_key
   ```
   The reason we are adding a 'B' in front of the keys here is because AWS doesn't allow keys in Amplify to start with "AWS".
   我们在这里在密钥前添加“B”的原因是 AWS 不允许 Amplify 中的密钥以“AWS”开头。

8. Click "Save and deploy" to start the deployment process.
   点击“保存并部署”以开始部署过程。

Your application will now be deployed using AWS Amplify.
您的应用程序现在将使用 AWS Amplify 进行部署。


### Service Role
### 服务角色

Once your application is deployed, if you selected to create a new service role:
部署应用程序后，如果您选择创建新的服务角色：

1. Go to your deployments page
   转到您的部署页面
2. Select the deployment you just created
   选择您刚刚创建的部署
3. Click on "App settings"
   点击“应用设置”
4. Copy the Service role ARN
   复制服务角色 ARN
5. Go to the IAM console and find this role
   转到 IAM 控制台并找到此角色
6. Attach the "AmazonBedrockFullAccess" policy to the role
   将“AmazonBedrockFullAccess”策略附加到该角色

This ensures that your Amplify app has the necessary permissions to interact with Amazon Bedrock.
这可确保您的 Amplify 应用具有与 Amazon Bedrock 交互所需的权限。

##  Customized Deployment and Development
##  定制化部署和开发
This project now supports flexible deployment and development configurations, allowing you to include or exclude specific components (left sidebar, right sidebar) based on your needs.
该项目现在支持灵活的部署和开发配置，允许您根据需要包含或排除特定组件（左侧边栏、右侧边栏）。
Configuration
配置
The inclusion of sidebars is controlled by a config.ts file, which uses environment variables to set the configuration:
侧边栏的包含由 config.ts 文件控制，该文件使用环境变量来设置配置：
```typescript
typescriptCopytype Config = {
  includeLeftSidebar: boolean;
  includeRightSidebar: boolean;
};

const config: Config = {
  includeLeftSidebar: process.env.NEXT_PUBLIC_INCLUDE_LEFT_SIDEBAR === "true",
  includeRightSidebar: process.env.NEXT_PUBLIC_INCLUDE_RIGHT_SIDEBAR === "true",
};

export default config;
```

This configuration uses two environment variables:
此配置使用两个环境变量：

NEXT_PUBLIC_INCLUDE_LEFT_SIDEBAR: Set to "true" to include the left sidebar
NEXT_PUBLIC_INCLUDE_LEFT_SIDEBAR: 设置为 "true" 以包含左侧边栏
NEXT_PUBLIC_INCLUDE_RIGHT_SIDEBAR: Set to "true" to include the right sidebar
NEXT_PUBLIC_INCLUDE_RIGHT_SIDEBAR: 设置为 "true" 以包含右侧边栏

## NPM Scripts
## NPM 脚本
The package.json includes several new scripts for different configurations:
package.json 包含几个用于不同配置的新脚本：

```bash
npm run dev: Runs the full app with both sidebars (default)
npm run dev: 运行带有两个侧边栏的完整应用（默认）
npm run build: Builds the full app with both sidebars (default)
npm run build: 构建带有两个侧边栏的完整应用（默认）
npm run dev:full: Same as npm run dev
npm run dev:full: 与 npm run dev 相同
npm run dev:left: Runs the app with only the left sidebar
npm run dev:left: 仅运行带有左侧边栏的应用
npm run dev:right: Runs the app with only the right sidebar
npm run dev:right: 仅运行带有右侧边栏的应用
npm run dev:chat: Runs the app with just the chat area (no sidebars)
npm run dev:chat: 仅运行聊天区域的应用（无侧边栏）
npm run build:full: Same as npm run build
npm run build:full: 与 npm run build 相同
npm run build:left: Builds the app with only the left sidebar
npm run build:left: 仅构建带有左侧边栏的应用
npm run build:right: Builds the app with only the right sidebar
npm run build:right: 仅构建带有右侧边-栏的应用
npm run build:chat: Builds the app with just the chat area (no sidebars)
npm run build:chat: 仅构建聊天区域的应用（无侧边栏）
```

Usage
用法
To use a specific configuration:
要使用特定配置：

For development: Run the desired script (e.g., npm run dev:left)
对于开发：运行所需的脚本（例如，npm run dev:left）
For production: Build with the desired script (e.g., npm run build:right)
对于生产：使用所需的脚本进行构建（例如，npm run build:right）

These scripts set the appropriate environment variables before running or building the application, allowing you to easily switch between different configurations.
这些脚本在运行或构建应用程序之前设置适当的环境变量，使您可以轻松地在不同配置之间切换。
This flexibility allows you to tailor the's layout to your specific needs, whether for testing, development, or production deployment.
这种灵活性使您可以根据特定需求（无论是测试、开发还是生产部署）定制应用程序的布局。

## Appendix
## 附录

This project is a prototype and is provided on an "as-is" basis. It is not intended for production use and may contain bugs, errors, or inconsistencies. By using this prototype, you acknowledge and agree that:
该项目是一个原型，按“原样”提供。它不适用于生产环境，可能包含错误、缺陷或不一致之处。使用此原型即表示您承认并同意：
- The software is provided in a pre-release, beta, or trial form.
- 该软件以预发布、测试版或试用版的形式提供。
- It may not be suitable for production or mission-critical environments.
- 它可能不适合生产或任务关键型环境。
- The developers are not responsible for any issues, data loss, or damages resulting from its use.
- 开发人员不对因使用该软件而导致的任何问题、数据丢失或损坏负责。
- No warranties or guarantees of any kind are provided, either expressed or implied.
- 不提供任何形式的明示或暗示的保证或担保。
- Support for this prototype may be limited or unavailable.
- 对此原型的支持可能有限或不可用。
- Use of this prototype is at your own risk. We encourage you to report any issues or provide feedback to help improve future versions.
- 使用此原型的风险由您自行承担。我们鼓励您报告任何问题或提供反馈，以帮助改进未来版本。
