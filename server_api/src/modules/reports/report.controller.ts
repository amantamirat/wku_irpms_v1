// report.controller.ts

import { Request, Response } from "express";
import mongoose from "mongoose";

import { ReportService } from "./report.service";

import { FundingSource } from "../grants/grant.model";
import { ProjectStatus } from "../projects/project.model";

import {
    IReportFilter
} from "./report.types";

import { successResponse } from "../../common/helpers/response";
import { toObjectId } from "../../common/utils/mongoose.utils";
import { console } from "inspector";
import { AuthenticatedRequest } from "../auth/auth.middleware";


export class ReportController {

    constructor(
        private readonly reportService: ReportService
    ) { }


    private buildFilter(
        req: Request
    ): IReportFilter {

        const {
            dateFrom,
            dateTo,
            grant,
            call,
            workspace,
            organization,
            calendar,
            fundingSource
        } = req.query;

        return {
            ...(dateFrom && {
                dateFrom: new Date(dateFrom as string)
            }),

            ...(dateTo && {
                dateTo: new Date(dateTo as string)
            }),

            ...(grant && {
                grant: toObjectId(
                    grant as string
                )
            }),

            ...(call && {
                call: toObjectId(
                    call as string
                )
            }),

            ...(workspace && {
                workspace: toObjectId(
                    workspace as string
                )
            }),

            ...(organization && {
                organization: toObjectId(
                    organization as string
                )
            }),

            ...(calendar && {
                calendar: toObjectId(
                    calendar as string
                )
            }),

            ...(fundingSource && {
                fundingSource: fundingSource as FundingSource
            })
        };
    }


    getDashboard = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {

        if (!req.auth) {
            return
        }

        const filter = this.buildFilter(req);

        const report =
            await this.reportService.getDashboard(
                filter,
                req.auth.scope
            );

        successResponse(
            res,
            200,
            "Report fetched successfully",
            report
        );
    };

    getPortfolio = async (
        req: Request,
        res: Response
    ) => {
        const filter = this.buildFilter(req);
        const report =
            await this.reportService.getPortfolio(
                filter
            );

        successResponse(
            res,
            200,
            "Portfolio report fetched successfully",
            report
        );
    };


    getApplications = async (
        req: Request,
        res: Response
    ) => {

        const report =
            await this.reportService.getApplications(
                this.buildFilter(req)
            );

        successResponse(
            res,
            200,
            "Application report fetched successfully",
            report
        );
    };


    getVerifications = async (
        req: Request,
        res: Response
    ) => {

        const report =
            await this.reportService.getVerifications(
                this.buildFilter(req)
            );

        successResponse(
            res,
            200,
            "Verification report fetched successfully",
            report
        );
    };


    getEvaluations = async (
        req: Request,
        res: Response
    ) => {

        const report =
            await this.reportService.getEvaluations(
                this.buildFilter(req)
            );

        successResponse(
            res,
            200,
            "Evaluation report fetched successfully",
            report
        );
    };

    getDepartments = async (
        req: Request,
        res: Response
    ) => {

        const filter = this.buildFilter(req);

        const report =
            await this.reportService.getDepartments(
                filter
            );
        successResponse(
            res,
            200,
            "Department report fetched successfully",
            report
        );
    };

    /////////////////////////////////////////////////////////////////////////////
    getDirectorateReport = async (
        req: Request,
        res: Response
    ) => {

        const report =
            await this.reportService.getDirectorateReport();

        successResponse(
            res,
            200,
            "Directorate report fetched successfully",
            report
        );
    };




    getFinancial = async (
        req: Request,
        res: Response
    ) => {

        const report =
            await this.reportService.getFinancial(
            );

        successResponse(
            res,
            200,
            "Financial report fetched successfully",
            report
        );
    };


    getPhases = async (
        req: Request,
        res: Response
    ) => {

        const report =
            await this.reportService.getPhases(
                this.buildFilter(req)
            );

        successResponse(
            res,
            200,
            "Phase report fetched successfully",
            report
        );
    };



}