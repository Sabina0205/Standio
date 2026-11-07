import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./e2e',timeout:45000,use:{baseURL:'http://127.0.0.1:5186',channel:'chrome',headless:true},webServer:{command:'npm.cmd run dev -- --port 5186 --strictPort',url:'http://127.0.0.1:5186',reuseExistingServer:false},reporter:'list'});


