---
layout: basic-clean
header_type: hero
title: Writings and Publications
permalink: /writings
---

{% include publication_template.html
    type = "Conference Paper"
    date = "June 2025"
    title = "GPU-Accelerated Propagation for the Stable Marriage Constraint"
    authors = "Stefano Travasci, Fabio Tardivo, Andrea Formisano"
    description = "Conference paper derived from my Master's thesis.<br>
                   I personally presented this paper at <a href=\"https://cilc2025.github.io/\" target=\"_blank\" rel=\"noopener\">CILC-2025</a> in Alghero in June 2025.<br>
                   Awaiting publication in the Proceedings of CILC-2025."
    abstract = "The Stable Marriage Problem (SMP) consists of finding a stable matching between two equally sized disjoint sets, typically referred to as men and women, based on individual preference lists. A matching is stable if no man and woman prefer each other over their assigned partners. The Gale–Shapley algorithm is the classical polynomial-time solution to this problem. In Constraint Programming (CP), the Stable Marriage Constraint (SMC) encapsulates this problem as a global constraint, with a consistency-enforcing propagator derived from an extended version of the Gale–Shapley algorithm. In this paper, we present a GPU-accelerated propagator for the SMC and its integration into a CP solver. Experimental results against the sequential version demonstrate the potential of GPU acceleration in handling large instances of the stable marriage constraint."
    btn_id = "2"
%}

{% include publication_template.html
    type = "Master's Thesis"
    date = "April 2025"
    title = "A GPU-based Parallel Propagator for the Stable Marriage Constraint"
    authors = "Stefano Travasci"
    description = "My Master's Thesis, supervised by prof. Andrea Formisano."
    abstract = "In this work, a CUDA-based parallel propagator for the Stable Marriage Problem is designed, imple-mented, and integrated into the Minicpp solver. Its performance is compared to a serial propagator basedon the one proposed by Unsworth and Prosser in 2013 [14]. The description of the serial propagatorincludes refinements and corrections to the original version presented in their paper.Appendix B introduces a CUDA-based algorithm for solving the Stable Marriage Problem.All the code used in this work is also available in the repository https://github.com/StefanoTrv/parallel_stable_marriage_constraint."
    btn_id = "1"
    link1_name = "See on ResearchGate"
    link1_url = "https://www.researchgate.net/publication/391483879_A_GPU-based_Parallel_Propagator_for_the_Stable_Marriage_Constraint"
%}

{% include publication_template.html
    type = "Conference paper"
    date = "August 2021"
    title = "Automatic Assignment of ICD-10 Codes to Diagnostic Texts using Transformers Based Techniques"
    authors = "M. H. Popescu, K. Roitero, S. Travasci, and V. Della Mea"
    description = "Conference paper derived from my Bachelor's thesis.<br>
               Published in the proceedings of the \"2021 IEEE 9th International Conference on Healthcare Informatics (ICHI)\", 2021, pp. 188–192.<br>
               Doi: 10.1109/ICHI52183.2021.00037."
    abstract = "A fundamental task for epidemiology, statistics, and health informatics is to associate some standardized meaning to textual expressions, to enable their retrieval, aggregation and interpretation. Among the relevant expressions, those mentioning health conditions and diagnoses are of paramount importance and can be found in almost any clinical document, including death certificates. These expressions are usually coded with the International Classification of Diseases. In this paper we employ both classical Machine Learning and BERT based models to perform the automatic classification of diagnostic texts extracted from death certificates. We show the effectiveness of our proposed approach over a set of experiments, where we experiment with multiple set of features and variant of the algorithms. Our results show that BERT based models, and in particular the ones pre-trained on the specific domain outperform classical ML algorithms, reaching Accuracy and F1-Score of respectively 0.952 and 0.943."
    btn_id = "0"
    link1_name = "See on IEEE Xplore"
    link1_url = "https://ieeexplore.ieee.org/document/9565784"
    link2_name = "See on ResearchGate"
    link2_url = "https://www.researchgate.net/publication/355341410_Automatic_Assignment_of_ICD-10_Codes_to_Diagnostic_Texts_using_Transformers_Based_Techniques"
%}

<div class="d-flex align-items-center justify-content-center my-5">
   <a href="/" role="button" class="btn btn-secondary">Back to Home</a>
   <a href="/portfolio" role="button" class="btn btn-secondary ml-5">Go to Portfolio</a>
</div>
