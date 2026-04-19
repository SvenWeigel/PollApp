import { Routes } from '@angular/router';
import { Landingpage } from './pages/landingpage/landingpage';
import { Newservey } from './pages/newservey/newservey';

export const routes: Routes = [
    {
        path: "",
        component: Landingpage,
    },
    {
        path: "newsurvey",
        component: Newservey,
    }
];
