#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AppsNetworkStack } from '../lib/apps-network-stack';
import { AppsFrontendStack } from '../lib/apps-frontend-stack';

const app = new cdk.App();

const env = {
  account: '979952482911',
  region: 'us-east-2',
};

const tags = { Project: 'APPS' };

new AppsNetworkStack(app, 'apps-network-stack', { env, tags });

new AppsFrontendStack(app, 'apps-frontend-stack', { env, tags });
