import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { NgSelectModule, NgOption } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Import firebase-firestore
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireAuthGuard } from '@angular/fire/auth-guard';

import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true
};

import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

// Import containers
import { DefaultLayoutComponent } from './containers';

import { P404Component } from './views/error/404.component';
import { P500Component } from './views/error/500.component';
import { LoginComponent } from './views/login/login.component';
import { UserComponent } from './views/user/user.component';
import { ListComponent } from './views/list/list.component';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

const APP_CONTAINERS = [DefaultLayoutComponent];

import {
  AppAsideModule,
  AppBreadcrumbModule,
  AppHeaderModule,
  AppFooterModule,
  AppSidebarModule
} from '@coreui/angular';

// Import routing module
import { AppRoutingModule } from './app.routing';

// Import 3rd party components
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { ChartsModule } from 'ng2-charts/ng2-charts';
import { DetailComponent } from './views/detail/detail.component';
import { NewspComponent } from './views/newsp/newsp.component';
import { LoadingIndicatorComponent } from './components/loading-indicator/loading-indicator.component';
import { PopoverModule } from 'ngx-bootstrap/popover';

// Custom Pipes
import { TruncatePipe } from './pipes/truncate.pipe';
import { HighlightPipe } from './pipes/highlight.pipe';
import { FilterPipe } from './pipes/filter.pipe';

import { PopupComponent } from './components/popup/popup.component';
import { Base64img } from './components/popup/base64img';

import { ModalModule } from 'ngx-bootstrap/modal';

import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AccordionModule } from 'ngx-bootstrap/accordion';

import { Eo4geoFooterComponent } from './components/eo4geo-footer/eo4geo-footer.component';
import { Eo4geoHeaderComponent } from './components/eo4geo-header/eo4geo-header.component';


@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    AppAsideModule,
    AppBreadcrumbModule.forRoot(),
    AppFooterModule,
    AppHeaderModule,
    AppSidebarModule,
    PerfectScrollbarModule,
    BsDropdownModule.forRoot(),
    TabsModule.forRoot(),
    ChartsModule,
    TooltipModule.forRoot(),
    NgSelectModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
    HttpClientModule,
    PopoverModule.forRoot(),
    ModalModule.forRoot(),
    BrowserAnimationsModule,
    CollapseModule.forRoot(),
    AccordionModule.forRoot()
  ],
  declarations: [
    AppComponent,
    ...APP_CONTAINERS,
    P404Component,
    P500Component,
    LoginComponent,
    UserComponent,
    ListComponent,
    DetailComponent,
    NewspComponent,
    LoadingIndicatorComponent,
    TruncatePipe,
    HighlightPipe,
    FilterPipe,
    PopupComponent,
    Eo4geoFooterComponent,
    Eo4geoHeaderComponent
  ],
  providers: [
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy
    },
    AngularFireAuthGuard,
    Base64img
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
