import { Routes } from '@angular/router';
import { HomepageComponent } from './marketing/homepage/homepage.component';
import { OnionGenComponent } from './components/onion-generator/onion-gen.component';
import { DocumentationComponent } from './components/documentation/documentation.component';
import { ImpressumComponent } from './components/impressum/impressum.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomepageComponent },
  { path: 'generator', component: OnionGenComponent },
  { path: 'documentation', component: DocumentationComponent },
  { path: 'impressum', component: ImpressumComponent },
  { path: '**', redirectTo: 'home' }, // Wildcard route for 404 pages
];
