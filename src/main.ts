import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { text } from 'body-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(text({type: 'text/plain'}));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
