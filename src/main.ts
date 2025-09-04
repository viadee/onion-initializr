import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './Infrastructure/Presentation/app.config';
import { AppComponent } from './Infrastructure/Presentation/app.component';

bootstrapApplication(AppComponent, appConfig).catch((err: unknown) =>
  console.error(err)
);
