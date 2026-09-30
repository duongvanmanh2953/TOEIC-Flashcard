import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccessKeyService, CreateAccessKeyDto, VerifyAccessKeyDto } from './access-key.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Bank Access Keys & Private Permissions')
@Controller('community')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccessKeyController {
  constructor(private readonly accessKeyService: AccessKeyService) {}

  @Get('users/search')
  @ApiOperation({ summary: 'Search users by name, email, or username to grant bank access' })
  searchUsers(@Query('q') query: string, @CurrentUser('id') currentUserId: string) {
    return this.accessKeyService.searchUsers(query || '', currentUserId);
  }

  @Get('access-keys/search-users')
  @ApiOperation({ summary: 'Search users by name, email, or username to grant bank access (alias)' })
  searchUsersAlt(@Query('q') query: string, @CurrentUser('id') currentUserId: string) {
    return this.accessKeyService.searchUsers(query || '', currentUserId);
  }

  @Post('access-keys')
  @ApiOperation({ summary: 'Owner creates or regenerates an Access Key for a specific student' })
  createAccessKey(
    @CurrentUser('id') ownerId: string,
    @CurrentUser('role') userRole: string,
    @Body() dto: CreateAccessKeyDto,
  ) {
    return this.accessKeyService.createAccessKey(ownerId, userRole, dto);
  }

  @Post('access-keys/verify')
  @ApiOperation({ summary: 'Student verifies and unlocks a protected bank using their personal access key' })
  verifyAccessKey(@CurrentUser('id') userId: string, @Body() dto: VerifyAccessKeyDto) {
    return this.accessKeyService.verifyAndUnlockWithKey(userId, dto);
  }

  @Get('access-keys/grants')
  @ApiOperation({ summary: 'Owner views list of students granted access to their bank (query-based)' })
  getBankAccessGrantsQuery(
    @CurrentUser('id') ownerId: string,
    @CurrentUser('role') userRole: string,
    @Query('bankType') bankType: 'VOCABULARY' | 'EXAM',
    @Query('bankId') bankId: string,
  ) {
    return this.accessKeyService.getBankAccessGrants(ownerId, userRole, bankType, bankId);
  }

  @Get('banks/:bankType/:bankId/access-grants')
  @ApiOperation({ summary: 'Owner views list of students granted access to their bank' })
  getBankAccessGrants(
    @CurrentUser('id') ownerId: string,
    @CurrentUser('role') userRole: string,
    @Param('bankType') bankType: 'VOCABULARY' | 'EXAM',
    @Param('bankId') bankId: string,
  ) {
    return this.accessKeyService.getBankAccessGrants(ownerId, userRole, bankType, bankId);
  }

  @Delete('access-keys/grants/:grantId')
  @ApiOperation({ summary: 'Owner revokes access key from a student immediately (RESTful DELETE)' })
  revokeAccessGrantDelete(
    @CurrentUser('id') ownerId: string,
    @CurrentUser('role') userRole: string,
    @Param('grantId') grantId: string,
  ) {
    return this.accessKeyService.revokeAccessGrant(ownerId, userRole, grantId);
  }

  @Post('access-grants/:grantId/revoke')
  @ApiOperation({ summary: 'Owner revokes access key from a student immediately' })
  revokeAccessGrant(
    @CurrentUser('id') ownerId: string,
    @CurrentUser('role') userRole: string,
    @Param('grantId') grantId: string,
  ) {
    return this.accessKeyService.revokeAccessGrant(ownerId, userRole, grantId);
  }
}
