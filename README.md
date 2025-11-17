<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment на AWS

### Предварительные требования

1. **AWS CLI** - установите и настройте:
   ```bash
   aws configure
   ```

2. **Elastic Beanstalk CLI** (для простого деплоя):
   ```bash
   pip install awsebcli
   ```

3. **Docker** - для сборки контейнера

### Переменные окружения

Создайте файл `.env` со следующими переменными:

```env
APP_PORT=3000
APP_BEARER_TOKEN=your-bearer-token-here
APP_SNAPEDIT_BASE_URL=https://api.snapedit.io
APP_SNAPEDIT_API_KEY=your-snapedit-api-key-here
APP_FILE_MAX_SIZE_MB=50
APP_QUEUE_LIMIT=10
```

### Вариант 1: Деплой на AWS Elastic Beanstalk (Рекомендуется для MVP)

Elastic Beanstalk - самый простой способ для быстрого деплоя.

#### Шаг 1: Подготовка

```bash
# Убедитесь, что все зависимости установлены
npm install

# Соберите приложение локально (опционально, для проверки)
npm run build
```

#### Шаг 2: Инициализация Elastic Beanstalk

```bash
# Инициализируем EB (выполняется один раз)
eb init -p docker snapedit-proxy --region us-east-1
```

#### Шаг 3: Создание и деплой environment

```bash
# Используйте готовый скрипт
./scripts/deploy.sh snapedit-proxy-prod

# Или вручную:
eb create snapedit-proxy-prod \
  --instance-type t3.small \
  --platform docker \
  --envvars APP_PORT=8080,APP_BEARER_TOKEN=your-token,APP_SNAPEDIT_API_KEY=your-key,APP_SNAPEDIT_BASE_URL=https://api.snapedit.io
```

#### Шаг 4: Настройка переменных окружения

После создания environment, настройте переменные окружения через AWS Console или CLI:

```bash
eb setenv \
  APP_BEARER_TOKEN=your-token \
  APP_SNAPEDIT_API_KEY=your-key \
  APP_SNAPEDIT_BASE_URL=https://api.snapedit.io \
  APP_FILE_MAX_SIZE_MB=50 \
  APP_QUEUE_LIMIT=10
```

#### Шаг 5: Последующие деплои

```bash
# Просто запустите скрипт
./scripts/deploy.sh snapedit-proxy-prod

# Или вручную:
eb deploy snapedit-proxy-prod
```

#### Полезные команды

```bash
# Проверить статус
eb status

# Посмотреть логи
eb logs

# Открыть приложение в браузере
eb open

# Удалить environment
eb terminate snapedit-proxy-prod
```

### Вариант 2: Деплой на AWS ECS Fargate

Для более гибкого управления инфраструктурой можно использовать ECS Fargate.

#### Шаг 1: Сборка и загрузка образа в ECR

```bash
./scripts/deploy-ecs.sh
```

#### Шаг 2: Создание ECS кластера и сервиса

Следуйте инструкциям в скрипте или используйте AWS Console для создания:
- ECS Cluster
- Task Definition
- ECS Service
- Application Load Balancer

### Локальный запуск с Docker

```bash
# Сборка образа
docker build -t snapedit-proxy .

# Запуск контейнера
docker run -p 3000:3000 --env-file .env snapedit-proxy

# Или с docker-compose
docker-compose up
```

### Мониторинг и логи

- **Elastic Beanstalk**: Используйте `eb logs` или AWS Console
- **CloudWatch**: Автоматически собирает логи из Elastic Beanstalk
- **Health Checks**: Настроены автоматически в `.ebextensions/01-nodejs.config`

### Масштабирование

Elastic Beanstalk автоматически настроен на масштабирование от 1 до 2 инстансов. Для изменения:

```bash
eb scale 2  # Увеличить до 2 инстансов
```

Или через AWS Console: Elastic Beanstalk → Configuration → Capacity

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
