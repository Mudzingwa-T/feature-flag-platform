import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { FlagsService } from './flags.service';
import { CreateFlagDto } from './dto/create-flag.dto';
import { UpdateFlagDto } from './dto/update-flag.dto';
import { QueryFlagsDto } from './dto/query-flags.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('flags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('flags')
export class FlagsController {
  constructor(private readonly flags: FlagsService) {}

  // Read: any authenticated user (ADMIN or VIEWER).
  @Get()
  @ApiOperation({ summary: 'List flags (paginated, optional environment filter)' })
  findAll(@Query() query: QueryFlagsDto) {
    return this.flags.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single flag' })
  findOne(@Param('id') id: string) {
    return this.flags.findOne(id);
  }

  // Writes: ADMIN only.
  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a flag (ADMIN)' })
  create(@Body() dto: CreateFlagDto, @CurrentUser() user: AuthUser) {
    return this.flags.create(dto, user.email);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a flag with optimistic concurrency (ADMIN)' })
  update(@Param('id') id: string, @Body() dto: UpdateFlagDto, @CurrentUser() user: AuthUser) {
    return this.flags.update(id, dto, user.email);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a flag (ADMIN)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.flags.remove(id, user.email);
  }
}
