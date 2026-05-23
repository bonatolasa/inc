import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AttachmentsService } from '../services/attachments.service';
import { getRoleDisplayName } from 'src/auth/utils/role.utils';
import { NotificationsService } from 'src/notifications/services/notifications.service';
import { TasksService } from 'src/tasks/services/tasks.service';
import { ActivitiesService } from 'src/activities/services/activities.service';
import { join } from 'path';
import { authorize } from 'src/auth/decorators/authorize.decorator';
import { Permissions } from 'src/auth/constants/permissions.constants';
import { Role } from 'src/enums/role.enum';

const filenameFactory = (
  _req: unknown,
  file: { originalname: string },
  cb: (error: Error | null, filename: string) => void,
) => {
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  cb(null, `${unique}${extname(file.originalname)}`);
};

const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.txt',
  '.csv',
  '.zip',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const fileFilter = (
  _req: unknown,
  file: { originalname: string },
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const extension = extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return cb(new BadRequestException('File type not allowed'), false);
  }
  cb(null, true);
};

@Controller()
export class AttachmentsController {
  constructor(
    private readonly attachmentsService: AttachmentsService,
    private readonly notificationsService: NotificationsService,
    private readonly tasksService: TasksService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  @authorize({
    permissions: [Permissions.ATTACHMENTS_UPLOAD],
    roles: [Role.TEAM_MEMBER, Role.TESTER, Role.PROJECT_MANAGER],
  })
  @Post('tasks/:id/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: filenameFactory,
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter,
    }),
  )
  async upload(
    @Param('id') taskId: string,
    @UploadedFile()
    file: { originalname: string; filename: string } | undefined,
    @CurrentUser() user: { id: string; role?: string },
    @Body('fileName') fileName?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const fileUrl = `/api/uploads/${file.filename}`;

    const data = await this.attachmentsService.create({
      taskId,
      fileName: fileName || file.originalname,
      fileUrl,
      uploadedBy: user.id,
    });

    // Notify all assigned members and the creator
    const notificationTargets = new Set<string>();
    try {
      const task = await this.tasksService.findById(taskId);

      // Add assignees
      if (task.assignedTo) {
        const assignee: any = task.assignedTo as any;
        const id = assignee._id?.toString() || assignee.toString();
        if (id !== user.id) notificationTargets.add(id);
      }

      // Add creator
      const creatorId =
        task.createdBy?._id?.toString() || task.createdBy?.toString();
      if (creatorId && creatorId !== user.id) {
        notificationTargets.add(creatorId);
      }

      const senderName = getRoleDisplayName(user?.role);


      for (const targetId of notificationTargets) {
        try {
          await this.notificationsService.create({
            userId: targetId,
            title: `File Attached by ${senderName}`,
            message: `A file '${data.fileName}' was attached to task: ${task.title}`,
            type: 'task_file_attached',
            relatedId: taskId,
          });
        } catch (err) {
          console.error(
            `Failed to notify ${targetId} about new attachment`,
            err,
          );
        }
      }
    } catch (err) {
      console.error(
        'Failed to notify relevant parties for attachment upload',
        err,
      );
    }

    await this.activitiesService
      .create({
        actionType: 'attachment_uploaded',
        performedBy: user.id,
        targetId: taskId,
        description: `Uploaded attachment '${data.fileName}' to task '${taskId}'`,
      })
      .catch(() => {
        /* non-blocking */
      });

    return {
      success: true,
      message: 'Attachment uploaded successfully',
      data,
    };
  }

  @authorize({
    permissions: [Permissions.ATTACHMENTS_VIEW],
    roles: [Role.TEAM_MEMBER, Role.TESTER, Role.PROJECT_MANAGER],
  })
  @Get('tasks/:id/attachments')
  async getByTask(@Param('id') taskId: string) {
    const data = await this.attachmentsService.getByTask(taskId);
    return {
      success: true,
      message: 'Attachments fetched successfully',
      data,
    };
  }

  @Get('uploads/:filename')
  async serveUpload(@Param('filename') filename: string, @Res() res: any) {
    const filePath = join(process.cwd(), 'uploads', filename);
    return res.sendFile(filePath);
  }

  @authorize({
    permissions: [Permissions.ATTACHMENTS_DELETE],
    roles: [Role.TEAM_MEMBER, Role.TESTER, Role.PROJECT_MANAGER],
  })
  @Delete('attachments/:id')
  async remove(
    @Param('id') attachmentId: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    await this.attachmentsService.remove(attachmentId, user);
    return {
      success: true,
      message: 'Attachment removed successfully',
      data: null,
    };
  }
}
