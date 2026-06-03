import { Routes } from '@angular/router';
import { Landingpage } from './pages/landingpage/landingpage';
import { Newsurvey } from './pages/newsurvey/newsurvey';
import { Survey } from './pages/survey/survey';

export const routes: Routes = [
    {
        path: "",
        component: Landingpage,
    },
    {
        path: "newsurvey",
        component: Newsurvey,
    },
    {
        path: "survey/:id",
        component: Survey,
    },
    {
        path: "survey",
        component: Survey,
    }
];
