import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './infrastructure/presentation/app.config';
import { AppComponent } from './infrastructure/presentation/app.component';

bootstrapApplication(AppComponent, appConfig).catch((err: unknown) =>
  console.error(err)
);
