import { 
  ScheduledService, 
  CreateScheduledServiceRequest, 
  CreateScheduledServiceResponse,
  UpdateServiceStatusRequest, 
  UpdateServiceStatusResponse,
  TechnicianScheduleResponse,
  ServiceStatus,
  ApiResponse 
} from '../../types';

// [API-INTEGRATION: Scheduling - Priority 1] Core scheduling endpoints
// Mock implementation - replace with real API calls in production

class SchedulingApiService {
  private mockServices: Map<string, ScheduledService> = new Map();
  private nextServiceId = 1;

  // Helper to generate service IDs
  private generateServiceId(): string {
    return `service-${this.nextServiceId++}`;
  }

  // Helper to simulate API delay
  private async simulateApiDelay(ms: number = 800): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * POST /api/scheduled-services
   * Create a new scheduled service (called when offer is accepted)
   */
  async createScheduledService(
    request: CreateScheduledServiceRequest
  ): Promise<ApiResponse<CreateScheduledServiceResponse>> {
    console.log(`📅 [SCHEDULING API] Creating scheduled service:`, request);
    
    try {
      await this.simulateApiDelay();

      const serviceId = this.generateServiceId();
      const now = new Date();
      
      // Create the scheduled service
      const service: ScheduledService = {
        id: serviceId,
        type: request.type,
        customerId: request.customerId,
        customerName: request.customerName,
        customerAddress: request.customerAddress,
        technicianId: request.technicianId,
        scheduledDate: new Date(request.scheduledDate),
        status: 'scheduled',
        estimatedDuration: request.estimatedDuration,
        notes: request.notes,
        poolbrainJobId: null, // Will be set when synced
        poolbrainSyncStatus: 'pending',
        createdAt: now,
        updatedAt: now,
        offerId: request.offerId,
        offerAcceptedAt: request.offerId ? now : undefined,
        location: request.location,
        serviceData: request.serviceData
      };

      // Store in mock database
      this.mockServices.set(serviceId, service);

      // Simulate Poolbrain sync (would be async in real implementation)
      setTimeout(() => {
        const updatedService = this.mockServices.get(serviceId);
        if (updatedService) {
          updatedService.poolbrainJobId = `pb-job-${Date.now()}`;
          updatedService.poolbrainSyncStatus = 'synced';
          updatedService.updatedAt = new Date();
          this.mockServices.set(serviceId, updatedService);
          console.log(`📅 [SCHEDULING API] Service ${serviceId} synced to Poolbrain`);
        }
      }, 3000);

      const response: CreateScheduledServiceResponse = {
        service,
        poolbrainJobId: null, // Will be set after async sync
        message: 'Scheduled service created successfully'
      };

      console.log(`✅ [SCHEDULING API] Service created:`, serviceId);
      return {
        success: true,
        data: response
      };

    } catch (error) {
      console.error(`❌ [SCHEDULING API] Failed to create service:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create scheduled service'
      };
    }
  }

  /**
   * GET /api/technician/:id/schedule
   * Get all scheduled services for a technician
   */
  async getTechnicianSchedule(
    technicianId: string,
    filters?: {
      date?: string; // ISO date string
      status?: ServiceStatus[];
      limit?: number;
      offset?: number;
    }
  ): Promise<ApiResponse<TechnicianScheduleResponse>> {
    console.log(`📅 [SCHEDULING API] Fetching schedule for technician:`, technicianId, filters);
    
    try {
      await this.simulateApiDelay(400);

      // Filter services for this technician
      let services = Array.from(this.mockServices.values())
        .filter(service => service.technicianId === technicianId);

      // Apply filters
      if (filters?.date) {
        const filterDate = new Date(filters.date);
        services = services.filter(service => {
          const serviceDate = new Date(service.scheduledDate);
          return serviceDate.toDateString() === filterDate.toDateString();
        });
      }

      if (filters?.status && filters.status.length > 0) {
        services = services.filter(service => 
          filters.status!.includes(service.status)
        );
      }

      // Sort by scheduled date
      services.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

      // Apply pagination
      const offset = filters?.offset || 0;
      const limit = filters?.limit || 50;
      const paginatedServices = services.slice(offset, offset + limit);

      // Calculate counts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayCount = services.filter(service => {
        const serviceDate = new Date(service.scheduledDate);
        serviceDate.setHours(0, 0, 0, 0);
        return serviceDate.getTime() === today.getTime();
      }).length;

      const upcomingCount = services.filter(service => 
        service.scheduledDate.getTime() >= tomorrow.getTime() && 
        service.status === 'scheduled'
      ).length;

      const completedCount = services.filter(service => 
        service.status === 'completed'
      ).length;

      const response: TechnicianScheduleResponse = {
        services: paginatedServices,
        totalCount: services.length,
        todayCount,
        upcomingCount,
        completedCount,
        lastUpdated: new Date().toISOString()
      };

      console.log(`✅ [SCHEDULING API] Schedule fetched:`, {
        total: response.totalCount,
        today: response.todayCount,
        upcoming: response.upcomingCount,
        completed: response.completedCount
      });

      return {
        success: true,
        data: response
      };

    } catch (error) {
      console.error(`❌ [SCHEDULING API] Failed to fetch schedule:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch technician schedule'
      };
    }
  }

  /**
   * PUT /api/scheduled-services/:id/status
   * Update service status (start, complete, etc.)
   */
  async updateServiceStatus(
    serviceId: string,
    request: UpdateServiceStatusRequest
  ): Promise<ApiResponse<UpdateServiceStatusResponse>> {
    console.log(`📅 [SCHEDULING API] Updating service status:`, serviceId, request);
    
    try {
      await this.simulateApiDelay(600);

      const service = this.mockServices.get(serviceId);
      if (!service) {
        return {
          success: false,
          error: 'Scheduled service not found'
        };
      }

      const now = new Date();
      
      // Update service
      const updatedService: ScheduledService = {
        ...service,
        status: request.status,
        notes: request.notes || service.notes,
        updatedAt: now
      };

      // Set timestamps based on status
      if (request.status === 'in_progress' && request.actualStartTime) {
        updatedService.actualStartTime = new Date(request.actualStartTime);
      }

      if (request.status === 'completed' && request.actualEndTime) {
        updatedService.actualEndTime = new Date(request.actualEndTime);
        
        // Calculate actual duration
        if (updatedService.actualStartTime) {
          updatedService.actualDuration = Math.round(
            (updatedService.actualEndTime.getTime() - updatedService.actualStartTime.getTime()) / (1000 * 60)
          );
        }
      }

      // Update location if provided
      if (request.location && updatedService.location) {
        updatedService.location = {
          ...updatedService.location,
          latitude: request.location.latitude,
          longitude: request.location.longitude
        };
      }

      // Store updated service
      this.mockServices.set(serviceId, updatedService);

      // Simulate Poolbrain sync
      const poolbrainSynced = Math.random() > 0.1; // 90% success rate
      if (poolbrainSynced) {
        updatedService.poolbrainSyncStatus = 'synced';
        console.log(`📅 [SCHEDULING API] Status update synced to Poolbrain`);
      } else {
        updatedService.poolbrainSyncStatus = 'failed';
        console.log(`⚠️ [SCHEDULING API] Poolbrain sync failed - will retry`);
      }

      const response: UpdateServiceStatusResponse = {
        service: updatedService,
        poolbrainSynced,
        message: 'Service status updated successfully'
      };

      console.log(`✅ [SCHEDULING API] Service status updated:`, serviceId, request.status);
      return {
        success: true,
        data: response
      };

    } catch (error) {
      console.error(`❌ [SCHEDULING API] Failed to update service status:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update service status'
      };
    }
  }

  /**
   * GET /api/scheduled-services/:id
   * Get specific scheduled service details
   */
  async getScheduledService(serviceId: string): Promise<ApiResponse<ScheduledService>> {
    console.log(`📅 [SCHEDULING API] Fetching service:`, serviceId);
    
    try {
      await this.simulateApiDelay(300);

      const service = this.mockServices.get(serviceId);
      if (!service) {
        return {
          success: false,
          error: 'Scheduled service not found'
        };
      }

      console.log(`✅ [SCHEDULING API] Service fetched:`, serviceId);
      return {
        success: true,
        data: service
      };

    } catch (error) {
      console.error(`❌ [SCHEDULING API] Failed to fetch service:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch scheduled service'
      };
    }
  }

  /**
   * DELETE /api/scheduled-services/:id
   * Cancel/delete a scheduled service
   */
  async cancelScheduledService(
    serviceId: string,
    reason?: string
  ): Promise<ApiResponse<{ message: string }>> {
    console.log(`📅 [SCHEDULING API] Cancelling service:`, serviceId, reason);
    
    try {
      await this.simulateApiDelay(400);

      const service = this.mockServices.get(serviceId);
      if (!service) {
        return {
          success: false,
          error: 'Scheduled service not found'
        };
      }

      // Update status to cancelled instead of deleting
      const cancelledService: ScheduledService = {
        ...service,
        status: 'cancelled',
        notes: reason ? `${service.notes || ''}\nCancellation reason: ${reason}`.trim() : service.notes,
        updatedAt: new Date()
      };

      this.mockServices.set(serviceId, cancelledService);

      console.log(`✅ [SCHEDULING API] Service cancelled:`, serviceId);
      return {
        success: true,
        data: { message: 'Scheduled service cancelled successfully' }
      };

    } catch (error) {
      console.error(`❌ [SCHEDULING API] Failed to cancel service:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel scheduled service'
      };
    }
  }

  // Development helper methods
  clearMockData(): void {
    this.mockServices.clear();
    this.nextServiceId = 1;
    console.log(`🧹 [SCHEDULING API] Mock data cleared`);
  }

  getMockServices(): ScheduledService[] {
    return Array.from(this.mockServices.values());
  }
}

// Export singleton instance
export const schedulingApi = new SchedulingApiService();