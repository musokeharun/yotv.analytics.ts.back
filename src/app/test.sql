SELECT
customers_login as 'Login',
profiles_name as 'Profile',
vods_name as 'VOD',
case when continue_watching_vods_finished = 1 then 'Yes' else 'No' end as 'Finished',
categories_name as 'Category',
group_concat(distinct genres_name) as 'Genres'
from continue_watching_vods
inner join profiles on profiles_id = continue_watching_vods_profiles_id
inner join customers on customers_id = profiles_customers_id
inner join vods on vods_id = continue_watching_vods_vods_id
left join categories on categories_id = vods_categories_id
left join vods_genres on vods_genres_vods_id = vods_id
inner join genres on genres_id = vods_genres_genres_id
where continue_watching_vods_updated > FROM_UNIXTIME(1644008400) and continue_watching_vods_updated < FROM_UNIXTIME(1644094799) and vods_id in ('1401','3017','3018','3019','3020','3021','3022','3023','3024','3025','3026','3027','3028','3029','3030','3031','3032','3033','3034','3035','3036','3080','3081','3082','3083','3084','3085','3086','3087','3088','3089','3090','3091','3120','3121','3122','3123','3124','3125','3126','3127','3128','3129','3130','3131','3132','3133','3134','3135','3136','3137','3138','3139','3140','3211','3212','3213','3214','3215','3216','3217','3218','3219','3220','3221','3222','3224','3225','3226','3227','3228','3229','3230','3231','3232','3233','3234','3235','3236','3237','3238','3239','3240','3241','3242','3243','3244','3245','3246','3247','3248','3249','3250','3251','3253','3254','3255','3256','3257','3259','5374','5809','3480','3481','3482','3483','3484','3485','3486','3487','3488','3489','3490','3491','3492','3493','3512','3494','3495','3496','3497','3498','3499','4724','3500','3501','3502','3503','3504','3505','3506','3507','3508','3509','3510','3511','3632','3633','3634','3635','3636','3637','3638','2262','3639','3640','3641','3642','3643','3644','3645','3646','3647','3648','3649','3650','3651','3652','3653','3654','3655','3656','3657','3658','3659','3660','3661','3662','3663','3664','3678','3679','3680','3681','3682','3683','3684','3685','3686','3687','3688','3689','3690','3691','3692','3693','3694','3695','3696','3697','3749','3750','3751','5578','5673','5810','3752','3753','2907','3754','3755','3756','3757','3758','3759','3760','3761','3762','3763','3764','3765','3766','3767','3768','3769','3770','3771','3772','3773','4546','4547','4548','4549','4550','4551','4552','4553','4554','4555','4556','4557','4558','4559','4560','4561','4562','4563','4564','4691','4692','4693','4694','4695','4696','4697','4698','4699','4700','4702','4703','4704','4705','4706','4707','4746','4747','4748','4749','4750','4751','4752','4753','4754','4755','4756','4757','4758','4759','4760','4761','4762','4763','4764','4765','4766','4767','4768','4769','4770','4771','4772','4773','4774','4775','4776','4778','4779','4780','4781','4782','4783','4784','4785','4786','4787','4788','4789','4790','4791','4792','4793','4794','4795','4796','4797','4799','4800','4801','4802','4803','4804','4805','4806','4807','4808','4809','4810','4811','4812','4813','4814','4815','4816','4817','4818','4819','4820','4821','4822','4823','4824','4825','4826','4827','4828','4829','4830','4831','4832','4833','4834','4835','4836','4837','4838','4839','4840','4841','4842','4843','4844','4845','4846','4847','4848','4849','4850','4851','4852','4854','4855','4856','4857','4858','4859','4860','4861','4862','4863','4864','4865','4866','4867','4868','4869','4870','4872','4873','4874','4875','4876','4877','4878','4879','4880','4881','4882','4883','4884','4885','4886','4887','4888','4889','4890','4891','926','4291','4973','1151','2201','4725','5787','1695','648','1453','2513','3075','5818','3063','1349','4002','4260','4252','2196','1150','4316','4303','1040','1446','5789','5194','4221','4974','1115','1298','1454','4253','4258','4250','4257','1455','5791','4667','1661','4304','4226','5604','2417','2323','2908','396','991','994','5603','5611','5610','5811','4223','5311','3806','4232','5721','3076','5790','5312','4333','5819','722','4314','522','3077','1147','1146','5313','332','1662','2143','1663','2264','4335','4231','1145','1351','5792','4367','1014','4976','5196','4720','5608','2978','4726','5040','5821','4317','4305','4224','1810','2420','1457','4977','5793','2909','5723','4960','637','5820','4727','5293','5292','5605','5599','5601','1407','5197','340','3079','5794','5795','929','930','1035','5314','4329','4728','992','2910','1030','1421','2141','2911','4284','4213','4289','4298','4288','4292','4293','4294','4296','1004','2703','2516','5796','4237','5762','4233','4235','4246','4239','1420','1142','1700','2951','5767','2704','1141','4337','4338','4369','4004','5797','5798','5392','4306','5487','5488','5384','5385','1346','2200','1283','2422','1452','1029','4214','4964','761','4234','4385','1964','2202','5606','5199','4729','5822','4722','4979','1702','2445','5675','1028','2953','1664','5757','4328','4309','4310','4217','1027','1458','4128','5147','5036','1307','2820','122','901','1881','1132','904','905','906','907','977','2366','2367','978','979','980','2146','2147','123','1205','1204','1203','1202','1201','1199','1198','1197','1196','1195','124','1194','1179','1180','1181','1182','1183','1184','1185','1186','1187','125','1188','1189','1190','1191','1192','1193','1270','1271','1272','1273','126','1274','1275','1276','1277','1278','1279','1280','4624','4625','5109','127','5110','2838','128','129','900','1467','903','2163','3109','2955','5290','4745','5800','1138','5801','5041','346','4387','4339','5315','2326','5676','1419','5802','2139','5580','5582','5581','4965','5319','4730','4318','724','1418','5824','517','4251','5805','1665','589','934','4340','1667','4731','2099','4651','1031','4324','4247','4225','4227','5825','1034','2269','343','4980','5758','4228','4286','1402','1417','1965','2447','1668','2203','4347','4313','4229','3853','4265','1415','5602','5607','4302','5806','4006','2959','4344','5318','1081','4307','5200','4390','1083','5826','972','4968','528','1342','1343','1447','1448','4343','4007','725','5777','324','664','665','666','667','668','669','656','657','658','660','659','661','662','663','4674','2098','4277','1671','4009','5660','646','5661','4255','527','4010','4981','5044','2271','1672','1412','5827','4652','1809','2705','2517','2325','1094','2204','1095','1096','1456','2327','5596','5597','5600','5321','4982','1409','5828','5383','2205','767','5585','5586','5587','2206','4733','2329','2054','4377','5335','5337','5202','4732','3065','4365','5323','2449','4345','4334','5388','5389','5799','671','680','681','682','672','673','674','675','676','677','678','679','5803','5804','2958','2519','2520','2521','348','3861','5763','4011','5046','2272','4256','4111','4300','4216','4312','4215','4285','4259','2273','4299','4254','1966','1856','935','4384','1673','5203','4266','1046','4240','645','4220','4287','3066','5330','2274','1025','5829','1603','5204','4734','1344','1708','4972','2334','821','803','850','876','834','2319','1386','1987','873','277','813','1334','39','851','4282','877','1383','1988','5761','5331','2450','4109','2960','5047','2097','5766','2207','3807','1709','2330','2950','2096','1967','5327','5324','5325','5326','5328','1106','1024','4290','4368','4336','4108','2331','4737','5048','2961','2208','4319','207','216','208','209','210','211','212','213','214','215','4241','5020','4012','4013','1710','4983','1858','2963','2956','5332','2095','5022','4236','4248','4243','4244','4230','4325','5192','4683','4688','221','818','231','4689','2107','294','1396','862','863','835','2822','5193','2316','878','801','5054','309','311','5386','5625','2117','806','556','5808','1323','23','1325','807','29','30','2119','1682','1683','809','810','811','1684','1992','1685','5772','40','2462','2463','2121','3803','1327','31','555','574','822','820','4280','2828','32','33','1686','1687','305','1688','1689','825','828','2464','4487','1387','2321','2824','2823','1336','795','34','832','1328','838','2108','2825','840','841','2125','2465','2126','1332','2127','845','4919','2320','846','847','2112','570','874','233','2827','3804','10','252','866','867','1397','2468','2826','2129','1335','4104','28','824','2109','4279','2102','2103','2130','279','1971','875','2104','2105','281','99','2830','2831','27','2469','2470','1990','4921','2132','2135','1390','879','880','886','883','25','2136','285','1693','2471','5813','1984','179','188','189','246','247','249','982','229','228','190','219','220','234','235','237','238','5205','5479','5481','5480','4267','3858','5050','990','1373','914','4966','4245','1033','1108','5333','4677','985','1021','4341','1110','5566','313','1675','4268','5399','4261','717','3864','4262','5567','4349','4681','5390','4655','2209','4315','1694','5334','1674','4015','5400','4014','1807','5052','1036','1037','2335','4678','719','4311','4269','244','245','4739','2275','5509','5512','5510','5511','5514','5513','740','3865','729','3119','5396','5391','4656','3866','5771','4350','999','1861','940','947','949','950','948','951','952','953','954','955','956','941','957','958','959','960','961','962','963','964','965','1049','942','1050','1051','1052','1053','1054','1055','1056','1057','1058','1059','943','1060','1061','1062','1063','1064','1065','1066','1067','1068','1069','944','1070','1071','1072','1073','1074','1075','1076','1077','1078','1079','945','1080','946','1047','1048','590','1393','1330','1392','1986','5489','5490','5491','1993','2002','2003','2004','2005','2006','2007','2008','2009','2010','2011','1994','2012','2013','2014','1995','1996','1997','1998','1999','2000','2001','2040','2049','2050','2051','5875','2041','2042','2043','2044','2045','2046','2047','2048','2053','2062','2063','2064','2065','2066','2067','2068','2069','2070','2071','2072','2073','2074','5876','2055','2056','2057','2058','2059','2060','2061','2077','2078','2079','2080','2081','2082','2083','2084','1152','1153','1154','1155','1156','1157','1158','1159','1160','1161','1162','1163','1164','1165','1166','1167','2138','1169','1170','1171','1173','1172','1980','650','2277','4657','4110','4679','4320','4680','5812','2962','314','325','4740','746','4321','4218','2336','5401','1020','2337','5568','984','4270','3698','316','4017','1019','4649','4322','1863','923','1981','5569','1016','4271','2707','1404','5570','4331','5588','5589','5590','1406','2339','2211','5420','2708','3868','917','916','921','922','924','4353','4352','5421','1284','4263','4295','1331','4102','4106','4107','814','1399','286','278','299','1384','1989','4330','5423','2278','318','5834','5830','3869','5207','5379','5378','5376','5377','4351','5025','4342','4332','1289','1018','1282','5591','5592','1023','1285','1804','1291','4709','4301','4346','1677','1676','1403','4354','5764','757','3068','5375','5382','5380','5381','1292','1293','4355','2458','983','4723','5486','5612','4710','2216','4272','4273','1450','2092','4356','4019','5577','5579','1287','1295','1038','2091','4742','5425','1865','4711','738','319','737','2090','3870','5483','5508','5484','5507','3871','2457','392','5770','5760','1798','1043','3872','1414','1678','4378','5839','5430','5832','5835','1616','2213','2214','4357','4358','4362','4364','5336','1679','4712','5775','4020','4021','5485','1983','2712','1866','5571','4359','5703','5426','1045','1022','1017','1413','5572','5833','911','765','1711','2089','5427','5573','5768','989','4371','599','1294','2215','5428','1602','4372','5733','753','1015','2709','651','2088','5431','2087','3116','1867','5429','647','5574','4715','1449','4360','643','5699','4274','4744','4662','597','5836','5432','5598','2344','3115','4361','4348','3071','1121','5765','4238','2809','4275','4276','5433','3859','4374','5575','938','4219','2282','4363','1869','996','5394','5397','5398','5395','5448','4327','5773','4686','4687','275','2116','553','1324','1322','569','1385','2461','2118','573','297','2120','815','224','1326','227','2122','817','819','577','230','823','4283','791','792','2124','306','793','794','296','826','829','831','2110','797','35','561','833','552','1329','839','1333','842','844','4920','2113','1400','2100','2101','853','854','576','584','798','232','13','12','860','861','9','255','799','7','1690','1691','2466','2467','789','2128','2114','2115','2111','4103','4105','104','2131','872','586','2829','2832','2318','282','4922','816','283','2133','2134','1692','24','2137','5055','1985','837','26','887','848','800','812','554','571','5387','4281','1991','4690','2106','5191','802','284','849','836','2552','5837','2283','2292','2293','2294','2295','2296','2297','2298','2299','2300','2301','2284','2302','2303','2304','2305','2306','2307','2308','2309','2310','2311','2285','2312','2313','2314','2286','2287','2288','2289','2290','2291','1451','5693','4716','563','3072','5449','5776','1871','5393','3073','1680','4308','5450','1681','4323','2349','5774','2086','1296','1410','4375','4717','3074','585','5674','4297','988','5451','3114','987','5694','5697','5701','5702','5700','5698','5696','5695','5452','1411','4664','644','600','5453','1969','986','5620','5641','5642','5663','5815','5817','5840','5848','5849','5858','5859','5816','1907','1908','1910','1911','1912','1913','5704','5705','5788','5206')
group by customers_login, profiles_name, vods_id, continue_watching_vods_finished
