import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/users.schemas';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { Project, ProjectSchema } from 'src/projects/schemas/project.schema';
import { RolesModule } from '../auth/roles/roles.module';
import { InvitationEmailService } from './services/invitation-email.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    RolesModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, InvitationEmailService],
  exports: [UsersService],
})
export class UsersModule {}
