import { Routes } from '@angular/router';
import { Landingpage } from './pages/landingpage/landingpage';
import { Newsurvey } from './pages/newsurvey/newsurvey';

export const routes: Routes = [
    {
        path: "",
        component: Landingpage,
    },
    {
        path: "newsurvey",
        component: Newsurvey,
    }
];
