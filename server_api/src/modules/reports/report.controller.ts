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
            fundingSource,
            department,
            college,
            theme,
            projectStatus
        } = req.query;

        return {

            ...(dateFrom && {
                dateFrom: new Date(
                    dateFrom as string
                )
            }),

            ...(dateTo && {
                dateTo: new Date(
                    dateTo as string
                )
            }),

            ...(grant && {
                grant: new mongoose.Types.ObjectId(
                    grant as string
                )
            }),

            ...(call && {
                call: new mongoose.Types.ObjectId(
                    call as string
                )
            }),

            ...(fundingSource && {
                fundingSource:
                    fundingSource as FundingSource
            }),

            ...(department && {
                department: new mongoose.Types.ObjectId(
                    department as string
                )
            }),

            ...(college && {
                college: new mongoose.Types.ObjectId(
                    college as string
                )
            }),

            ...(theme && {
                theme: new mongoose.Types.ObjectId(
                    theme as string
                )
            }),

            ...(projectStatus && {
                projectStatus:
                    projectStatus as ProjectStatus
            })
        };
    }


    getDashboard = async (
        req: Request,
        res: Response
    ) => {

        const filter = this.buildFilter(req);

        const report =
            await this.reportService.getDashboard(
                filter
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

        const report =
            await this.reportService.getPortfolio(
                this.buildFilter(req)
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


    getEvaluation = async (
        req: Request,
        res: Response
    ) => {

        const report =
            await this.reportService.getEvaluation(
                this.buildFilter(req)
            );

        successResponse(
            res,
            200,
            "Evaluation report fetched successfully",
            report
        );
    };


    getFinancial = async (
        req: Request,
        res: Response
    ) => {

        const report =
            await this.reportService.getFinancial(
                this.buildFilter(req)
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
}