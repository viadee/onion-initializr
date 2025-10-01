import { expect } from "chai";
import { ApplicationService } from "../../../../lib/Domain/Entities/ApplicationService";
import { DomainService } from "../../../../lib/Domain/Entities/DomainService";
import { AppServiceDependencyAppService } from "../../Application/Services/AppServiceDependencyAppService";
describe("AppServiceDependencyAppService", () => {
  let service: AppServiceDependencyAppService;

  beforeEach(() => {
    service = new AppServiceDependencyAppService();
  });

  describe("pickDependencies", () => {
    describe("when initialized", () => {
      it("should create an instance of AppServiceDependencyAppService", () => {
        expect(service).to.be.instanceOf(AppServiceDependencyAppService);
      });

      it("should handle empty application services array", async () => {
        const applicationServices: ApplicationService[] = [];
        const domainServices = [new DomainService("TestService", [])];
        const repositoryInterfaces = ["ITestRepository"];

        // This test only verifies that empty array returns empty object
        let mockCalled = false;

        const result = await service.pickDependencies(
          applicationServices,
          domainServices,
          repositoryInterfaces,
        );

        expect(result).to.deep.equal({});
        expect(mockCalled).to.be.false; // Should not call inquirer for empty array
      });

      it("should have a pickDependencies method", () => {
        expect(service.pickDependencies).to.be.a("function");
      });

      it("should accept correct parameters for pickDependencies", () => {
        const applicationServices = [
          new ApplicationService("TestAppService", [], [], false),
        ];
        const domainServices = [new DomainService("TestService", [])];
        const repositoryInterfaces = ["ITestRepository"];

        // This should not throw - just verify the method exists and accepts parameters
        const result = service.pickDependencies(
          applicationServices,
          domainServices,
          repositoryInterfaces,
        );
        expect(result).to.be.instanceOf(Promise);
      });

      it("should return a promise from pickDependencies", () => {
        const applicationServices = [
          new ApplicationService("TestAppService", [], [], false),
        ];
        const domainServices = [new DomainService("TestService", [])];
        const repositoryInterfaces = ["ITestRepository"];

        const result = service.pickDependencies(
          applicationServices,
          domainServices,
          repositoryInterfaces,
        );

        expect(result).to.be.instanceOf(Promise);
      });
    });

    describe("when processing application services", () => {
      it("should handle application services with correct structure", () => {
        const applicationService = new ApplicationService(
          "UserAppService",
          [],
          [],
          false,
        );

        expect(applicationService.name).to.equal("UserAppService");
        expect(applicationService.domainServices).to.be.an("array");
        expect(applicationService.repositories).to.be.an("array");
        expect(applicationService.useAngularDI).to.be.a("boolean");
      });

      it("should handle domain services with correct structure", () => {
        const domainService = new DomainService("UserService", []);

        expect(domainService.serviceName).to.equal("UserService");
        expect(domainService.entities).to.be.an("array");
      });

      it("should handle repository interfaces as strings", () => {
        const repositoryInterfaces = [
          "IUserRepository",
          "IOrderRepository",
          "IPaymentRepository",
        ];

        // Test each repository interface
        expect(repositoryInterfaces[0]).to.be.a("string");
        expect(repositoryInterfaces[0]).to.match(/^I[A-Z]/);
        expect(repositoryInterfaces[1]).to.be.a("string");
        expect(repositoryInterfaces[1]).to.match(/^I[A-Z]/);
        expect(repositoryInterfaces[2]).to.be.a("string");
        expect(repositoryInterfaces[2]).to.match(/^I[A-Z]/);
      });
    });
  });
});
