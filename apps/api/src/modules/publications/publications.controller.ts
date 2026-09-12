import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PublicationsService } from './publications.service';
import { CreatePublicationDto, UpdatePublicationDto } from './dto/publication.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountStatusGuard } from '../../common/guards/account-status.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('publications')
@Controller('publications')
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active publications' })
  list(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.publicationsService.list({ page, limit });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get publication detail (< 300ms)' })
  getDetail(@Param('id') id: string) {
    return this.publicationsService.getDetail(id);
  }

  @UseGuards(JwtAuthGuard, AccountStatusGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create publication (authenticated)' })
  create(@Body() dto: CreatePublicationDto) {
    return this.publicationsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update publication (Admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdatePublicationDto) {
    return this.publicationsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate publication (Admin only)' })
  deactivate(@Param('id') id: string) {
    return this.publicationsService.deactivate(id);
  }
}
