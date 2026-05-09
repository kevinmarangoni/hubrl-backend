import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HubrlsModule } from '../hubrls/hubrls.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: () => {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
          throw new Error('MONGODB_URI nao configurada');
        }

        return { uri };
      },
    }),
    UsersModule,
    HubrlsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
